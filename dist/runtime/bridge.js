/**
 * TS Runtime Bridge — thin wrapper over omx-runtime binary.
 *
 * All semantic state mutations route through `execCommand()`.
 * All state queries read Rust-authored compatibility JSON files.
 * Set OMX_RUNTIME_BRIDGE=0 to disable bridge (fallback to TS-direct).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCanonicalTeamStateRoot } from '../team/state-root.js';
import { safeJsonParse } from '../utils/safe-json.js';
const __bridge_dirname = dirname(fileURLToPath(import.meta.url));
// ---------------------------------------------------------------------------
// Bridge class
// ---------------------------------------------------------------------------
/**
 * Raised when the omx-runtime binary returns output that fails JSON decoding.
 *
 * Distinguishing parse failure from spawn failure (which `run()` already wraps
 * in a generic `Error`) lets callers — e.g. dispatch loops in
 * `team/state/dispatch.ts` — react with a typed `instanceof` check instead of
 * inspecting error messages, and to mark the affected command failed without
 * tearing down the surrounding watcher loop.
 */
export class RuntimeBridgeError extends Error {
    context;
    constructor(message, context = {}) {
        super(message);
        this.name = 'RuntimeBridgeError';
        this.context = context;
    }
}
let schemaValidated = false;
export function resolveRuntimeBinaryPath(options = {}) {
    const exists = options.exists ?? existsSync;
    const envOverride = process.env.OMX_RUNTIME_BINARY?.trim();
    if (envOverride)
        return envOverride;
    const workspaceDebug = options.debugPath ?? resolve(__bridge_dirname, '../../target/debug/omx-runtime');
    if (exists(workspaceDebug))
        return workspaceDebug;
    const workspaceRelease = options.releasePath ?? resolve(__bridge_dirname, '../../target/release/omx-runtime');
    if (exists(workspaceRelease))
        return workspaceRelease;
    return options.fallbackBinary ?? 'omx-runtime';
}
export function resolveBridgeStateDir(cwd, env = process.env) {
    return resolveCanonicalTeamStateRoot(cwd, env);
}
export class RuntimeBridge {
    binaryPath;
    stateDir;
    enabled;
    constructor(options = {}) {
        this.enabled = process.env.OMX_RUNTIME_BRIDGE !== '0';
        this.stateDir = options.stateDir;
        this.binaryPath = options.binaryPath ?? resolveRuntimeBinaryPath();
    }
    /** Whether the bridge is enabled (OMX_RUNTIME_BRIDGE != '0'). */
    isEnabled() {
        return this.enabled;
    }
    /** Execute a RuntimeCommand and return the resulting RuntimeEvent. */
    execCommand(cmd, options) {
        this.validateSchemaOnce();
        const json = JSON.stringify(cmd);
        const args = ['exec', json];
        if (this.stateDir)
            args.push(`--state-dir=${this.stateDir}`);
        if (options?.compact)
            args.push('--compact');
        const stdout = this.run(args);
        // Non-JSON stdout means the runtime contract was violated (truncated pipe,
        // schema drift, panic before flush). Surface a typed error so dispatch
        // callers can mark the command failed instead of bubbling SyntaxError up
        // through unrelated layers.
        try {
            return JSON.parse(stdout);
        }
        catch (cause) {
            throw new RuntimeBridgeError(`omx-runtime exec returned non-JSON output for ${cmd.command}`, { command: cmd.command, stdoutPreview: stdout.slice(0, 200), cause });
        }
    }
    /** Read the current RuntimeSnapshot. */
    readSnapshot() {
        const args = ['snapshot', '--json'];
        if (this.stateDir)
            args.push(`--state-dir=${this.stateDir}`);
        const stdout = this.run(args);
        // Same parse hazard as execCommand: a partial snapshot pipe surfaces
        // here as a SyntaxError that the caller almost never expects.
        try {
            return JSON.parse(stdout);
        }
        catch (cause) {
            throw new RuntimeBridgeError('omx-runtime snapshot returned non-JSON output', {
                command: 'snapshot',
                stdoutPreview: stdout.slice(0, 200),
                cause,
            });
        }
    }
    /** Initialize a fresh state directory. */
    initStateDir(dir) {
        this.run(['init', dir]);
        this.stateDir = dir;
    }
    /** Read a Rust-authored compatibility file as typed JSON. */
    readCompatFile(filename) {
        if (!this.stateDir)
            return null;
        const filePath = join(this.stateDir, filename);
        if (!existsSync(filePath))
            return null;
        // Compat files cross a Rust→JS boundary and can be observed mid-rename
        // (`writeAtomic` swaps a tmp file into place) or empty (truncate-then-write).
        // The only sane recovery is to return null so HUD/dispatch fall through to
        // their JS-inferred state for this tick — throwing here would abort the
        // entire query path. `readFileSync` itself can also raise EACCES/EISDIR
        // on edge cases; treat those identically.
        let content;
        try {
            content = readFileSync(filePath, 'utf-8');
        }
        catch {
            return null;
        }
        return safeJsonParse(content, null);
    }
    /** Read authority snapshot from compatibility file. */
    readAuthority() {
        return this.readCompatFile('authority.json');
    }
    /** Read readiness snapshot from compatibility file. */
    readReadiness() {
        return this.readCompatFile('readiness.json');
    }
    /** Read backlog snapshot from compatibility file. */
    readBacklog() {
        return this.readCompatFile('backlog.json');
    }
    /**
     * Read dispatch records from compatibility file.
     * Transforms Rust format ({ records: [...] }) to flat array,
     * and maps `target` → `to_worker` + merges metadata fields.
     */
    readDispatchRecords() {
        const raw = this.readCompatFile('dispatch.json');
        if (!raw?.records)
            return [];
        return raw.records;
    }
    /** Read mailbox records from compatibility file. */
    readMailboxRecords() {
        const raw = this.readCompatFile('mailbox.json');
        if (!raw?.records)
            return [];
        return raw.records;
    }
    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------
    validateSchemaOnce() {
        if (schemaValidated)
            return;
        try {
            const stdout = this.run(['schema', '--json']);
            const schema = JSON.parse(stdout);
            const expectedCommands = [
                'acquire-authority', 'renew-authority', 'queue-dispatch',
                'mark-notified', 'mark-delivered', 'mark-failed',
                'request-replay', 'capture-snapshot',
            ];
            const missing = expectedCommands.filter((c) => !schema.commands?.includes(c));
            if (missing.length > 0) {
                throw new Error(`omx-runtime schema missing commands: ${missing.join(', ')}. ` +
                    `Bridge types may be out of sync with the Rust binary.`);
            }
            schemaValidated = true;
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('schema missing'))
                throw err;
            // Binary not available — schema validation skipped
            schemaValidated = true;
        }
    }
    run(args) {
        try {
            const result = execFileSync(this.binaryPath, args, {
                encoding: 'utf-8',
                timeout: 10_000,
                maxBuffer: 1024 * 1024,
                windowsHide: true,
            });
            return result;
        }
        catch (err) {
            const execErr = err;
            const stderr = execErr.stderr?.trim() ?? execErr.message ?? 'unknown error';
            throw new Error(`omx-runtime ${args[0]} failed: ${stderr}`);
        }
    }
}
// ---------------------------------------------------------------------------
// Module-level singleton for convenience
// ---------------------------------------------------------------------------
let _defaultBridge;
export function getDefaultBridge(stateDir) {
    if (stateDir) {
        return new RuntimeBridge({ stateDir });
    }
    if (!_defaultBridge) {
        _defaultBridge = new RuntimeBridge({ stateDir });
    }
    return _defaultBridge;
}
export function isBridgeEnabled() {
    return process.env.OMX_RUNTIME_BRIDGE !== '0';
}
//# sourceMappingURL=bridge.js.map