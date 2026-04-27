import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { codexConfigPath } from "../utils/paths.js";
import { SETUP_INSTALL_MODES, SETUP_SCOPES, } from "./setup.js";
/**
 * Legacy scope values that may appear in persisted setup-scope.json files.
 * Both 'project-local' (renamed) and old 'project' (minimal, removed) are
 * migrated to the current 'project' scope on read.
 */
const LEGACY_SCOPE_MIGRATION_SYNC = {
    "project-local": "project",
};
export function readPersistedSetupScope(cwd) {
    return readPersistedSetupPreferences(cwd)?.scope;
}
export function readPersistedSetupPreferences(cwd) {
    const scopePath = join(cwd, ".omx", "setup-scope.json");
    if (!existsSync(scopePath))
        return undefined;
    try {
        const parsed = JSON.parse(readFileSync(scopePath, "utf-8"));
        const persisted = {};
        if (typeof parsed.scope === "string") {
            if (SETUP_SCOPES.includes(parsed.scope)) {
                persisted.scope = parsed.scope;
            }
            const migrated = LEGACY_SCOPE_MIGRATION_SYNC[parsed.scope];
            if (migrated)
                persisted.scope = migrated;
        }
        if (typeof parsed.installMode === "string"
            && SETUP_INSTALL_MODES.includes(parsed.installMode)) {
            persisted.installMode = parsed.installMode;
        }
        return Object.keys(persisted).length > 0 ? persisted : undefined;
    }
    catch (err) {
        process.stderr.write(`[cli/codex-home] operation failed: ${err}\n`);
        // Ignore malformed persisted scope and use defaults.
    }
    return undefined;
}
export function resolveCodexHomeForLaunch(cwd, env = process.env) {
    if (env.CODEX_HOME && env.CODEX_HOME.trim() !== "")
        return env.CODEX_HOME;
    const persistedScope = readPersistedSetupScope(cwd);
    if (persistedScope === "project") {
        return join(cwd, ".codex");
    }
    return undefined;
}
export function resolveCodexConfigPathForLaunch(cwd, env = process.env) {
    const codexHomeOverride = resolveCodexHomeForLaunch(cwd, env);
    return codexHomeOverride
        ? join(codexHomeOverride, "config.toml")
        : codexConfigPath();
}
//# sourceMappingURL=codex-home.js.map