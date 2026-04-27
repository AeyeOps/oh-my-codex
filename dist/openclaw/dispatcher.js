/**
 * OpenClaw Gateway Dispatcher
 *
 * Sends instruction payloads to OpenClaw gateways via HTTP or CLI command.
 * All calls are non-blocking with timeouts. Failures are swallowed
 * to avoid blocking hooks.
 *
 * SECURITY: Command gateway requires OMX_OPENCLAW_COMMAND=1 opt-in.
 * Command timeout is configurable with safe bounds.
 * Prefers execFile for simple commands; falls back to sh -c only for shell metacharacters.
 */
/** Default per-request timeout for HTTP gateways */
const DEFAULT_HTTP_TIMEOUT_MS = 10_000;
/** Default command gateway timeout (backward-compatible default) */
const DEFAULT_COMMAND_TIMEOUT_MS = 5_000;
/**
 * Command timeout safety bounds.
 * - Minimum 100ms: avoids immediate/near-zero timeout misconfiguration.
 * - Maximum 300000ms (5 minutes): prevents runaway long-lived command processes.
 */
const MIN_COMMAND_TIMEOUT_MS = 100;
const MAX_COMMAND_TIMEOUT_MS = 300_000;
/** Shell metacharacters that require sh -c instead of execFile */
const SHELL_METACHAR_RE = /[|&;><`$()]/;
/**
 * Validate gateway URL. Must be HTTPS, except localhost/127.0.0.1/::1
 * which allows HTTP for local development.
 */
export function validateGatewayUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:")
            return true;
        if (parsed.protocol === "http:" &&
            (parsed.hostname === "localhost" ||
                parsed.hostname === "127.0.0.1" ||
                parsed.hostname === "::1" ||
                parsed.hostname === "[::1]")) {
            return true;
        }
        return false;
    }
    catch (err) {
        process.stderr.write(`[openclaw-dispatcher] operation failed: ${err}\n`);
        return false;
    }
}
/**
 * Interpolate template variables in an instruction string.
 *
 * Supported variables (from hook context):
 * - {{projectName}} - basename of project directory
 * - {{projectPath}} - full project directory path
 * - {{sessionId}} - session identifier
 * - {{prompt}} - prompt text
 * - {{contextSummary}} - context summary (session-end event)
 * - {{question}} - question text (ask-user-question event)
 * - {{timestamp}} - ISO timestamp
 * - {{event}} - hook event name
 * - {{instruction}} - interpolated instruction (for command gateway)
 * - {{replyChannel}} - originating channel (from OPENCLAW_REPLY_CHANNEL env var)
 * - {{replyTarget}} - reply target user/bot (from OPENCLAW_REPLY_TARGET env var)
 * - {{replyThread}} - reply thread ID (from OPENCLAW_REPLY_THREAD env var)
 *
 * Unresolved variables are replaced with empty string.
 */
export function interpolateInstruction(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        return variables[key] ?? "";
    });
}
/**
 * Type guard: is this gateway config a command gateway?
 */
export function isCommandGateway(config) {
    return config.type === "command";
}
/**
 * Shell-escape a string for safe embedding in a shell command.
 * Uses single-quote wrapping with internal quote escaping.
 */
export function shellEscapeArg(value) {
    return "'" + value.replace(/'/g, "'\\''") + "'";
}
/**
 * Resolve command gateway timeout with precedence:
 * gateway timeout > OMX_OPENCLAW_COMMAND_TIMEOUT_MS > default.
 */
export function resolveCommandTimeoutMs(gatewayTimeout, envTimeoutRaw = process.env.OMX_OPENCLAW_COMMAND_TIMEOUT_MS) {
    const parseFinite = (value) => {
        if (typeof value !== "number" || !Number.isFinite(value))
            return undefined;
        return value;
    };
    const parseEnv = (value) => {
        if (!value)
            return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };
    const rawTimeout = parseFinite(gatewayTimeout) ??
        parseEnv(envTimeoutRaw) ??
        DEFAULT_COMMAND_TIMEOUT_MS;
    return Math.min(MAX_COMMAND_TIMEOUT_MS, Math.max(MIN_COMMAND_TIMEOUT_MS, Math.trunc(rawTimeout)));
}
/**
 * Wake an HTTP-type OpenClaw gateway with the given payload.
 */
export async function wakeGateway(gatewayName, gatewayConfig, payload) {
    if (!validateGatewayUrl(gatewayConfig.url)) {
        return {
            gateway: gatewayName,
            success: false,
            error: "Invalid URL (HTTPS required)",
        };
    }
    try {
        const headers = {
            "Content-Type": "application/json",
            ...gatewayConfig.headers,
        };
        const timeout = gatewayConfig.timeout ?? DEFAULT_HTTP_TIMEOUT_MS;
        const response = await fetch(gatewayConfig.url, {
            method: gatewayConfig.method || "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(timeout),
        });
        if (!response.ok) {
            return {
                gateway: gatewayName,
                success: false,
                error: `HTTP ${response.status}`,
                statusCode: response.status,
            };
        }
        return { gateway: gatewayName, success: true, statusCode: response.status };
    }
    catch (error) {
        return {
            gateway: gatewayName,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * Wake a command-type OpenClaw gateway by executing a shell command.
 *
 * SECURITY REQUIREMENTS:
 * - Requires OMX_OPENCLAW_COMMAND=1 opt-in (separate gate from OMX_OPENCLAW)
 * - Timeout is configurable via gateway.timeout or OMX_OPENCLAW_COMMAND_TIMEOUT_MS
 *   with safe clamping bounds and backward-compatible default 5000ms
 * - Prefers execFile for simple commands (no metacharacters)
 * - Falls back to sh -c only when metacharacters detected
 * - detached: false to prevent orphan processes
 * - SIGTERM cleanup handler kills child on parent SIGTERM, 1s grace then SIGKILL
 *
 * The command template supports {{variable}} placeholders. All variable
 * values are shell-escaped before interpolation to prevent injection.
 */
export async function wakeCommandGateway(gatewayName, gatewayConfig, variables) {
    // Separate command gateway opt-in gate
    if (process.env.OMX_OPENCLAW_COMMAND !== "1") {
        return {
            gateway: gatewayName,
            success: false,
            error: "Command gateway disabled (set OMX_OPENCLAW_COMMAND=1 to enable)",
        };
    }
    let child = null;
    let sigtermHandler = null;
    try {
        const { execFile, exec } = await import("child_process");
        const timeout = resolveCommandTimeoutMs(gatewayConfig.timeout);
        // Interpolate variables with shell escaping
        const interpolated = gatewayConfig.command.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = variables[key];
            if (value === undefined)
                return match;
            return shellEscapeArg(value);
        });
        // Detect whether the interpolated command contains shell metacharacters
        const hasMetachars = SHELL_METACHAR_RE.test(interpolated);
        await new Promise((resolve, reject) => {
            const cleanup = (signal) => {
                if (child) {
                    child.kill(signal);
                    // 1s grace period then SIGKILL
                    setTimeout(() => {
                        try {
                            child?.kill("SIGKILL");
                        }
                        catch (err) {
                            process.stderr.write(`[openclaw-dispatcher] operation failed: ${err}\n`);
                        }
                    }, 1000);
                }
            };
            sigtermHandler = () => cleanup("SIGTERM");
            process.once("SIGTERM", sigtermHandler);
            const onExit = (code, signal) => {
                if (sigtermHandler) {
                    process.removeListener("SIGTERM", sigtermHandler);
                    sigtermHandler = null;
                }
                if (signal) {
                    reject(new Error(`Command killed by signal ${signal}`));
                }
                else if (code !== 0) {
                    reject(new Error(`Command exited with code ${code}`));
                }
                else {
                    resolve();
                }
            };
            const onError = (err) => {
                if (sigtermHandler) {
                    process.removeListener("SIGTERM", sigtermHandler);
                    sigtermHandler = null;
                }
                reject(err);
            };
            if (hasMetachars) {
                // Fall back to sh -c for complex commands with metacharacters
                child = exec(interpolated, {
                    timeout,
                    env: { ...process.env },
                });
            }
            else {
                // Parse simple command: split on whitespace, use execFile
                const parts = interpolated.split(/\s+/).filter(Boolean);
                const cmd = parts[0];
                const args = parts.slice(1);
                child = execFile(cmd, args, {
                    timeout,
                    env: { ...process.env },
                });
            }
            // Ensure detached is false (default, but explicit via options above)
            child.on("exit", onExit);
            child.on("error", onError);
        });
        return { gateway: gatewayName, success: true };
    }
    catch (error) {
        // Ensure SIGTERM handler is cleaned up on error
        if (sigtermHandler) {
            process.removeListener("SIGTERM", sigtermHandler);
        }
        return {
            gateway: gatewayName,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
//# sourceMappingURL=dispatcher.js.map