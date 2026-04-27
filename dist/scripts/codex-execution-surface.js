import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
function safeString(value) {
    return typeof value === "string" ? value : "";
}
function safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
}
function readPersistedSessionStateSync(cwd) {
    const path = join(cwd, ".omx", "state", "session.json");
    if (!existsSync(path))
        return null;
    try {
        return safeObject(JSON.parse(readFileSync(path, "utf-8")));
    }
    catch {
        return null;
    }
}
export function resolveCodexExecutionSurface(cwd, options = {}) {
    const transport = safeString(process.env.TMUX).trim()
        ? "attached-tmux"
        : "outside-tmux";
    const payloadSessionId = safeString(options.payload?.session_id ?? options.payload?.sessionId).trim();
    const payloadSource = safeString(options.payload?.source).trim().toLowerCase();
    const persistedSession = readPersistedSessionStateSync(cwd);
    const persistedNativeSessionId = safeString(persistedSession?.native_session_id).trim();
    const explicitCliSource = payloadSource === "cli" || payloadSource === "shell" || payloadSource === "terminal";
    const explicitNativeSource = payloadSource === "native" || payloadSource === "codex-app" || payloadSource === "app";
    const launcher = !explicitCliSource && (explicitNativeSource
        || (options.hookEventName === "SessionStart" && safeString(options.nativeSessionId).trim() !== "")
        || (!!payloadSessionId && payloadSessionId === persistedNativeSessionId)
        || (!!safeString(options.canonicalSessionId).trim()
            && !!safeString(options.nativeSessionId).trim()
            && safeString(options.canonicalSessionId).trim() !== safeString(options.nativeSessionId).trim()))
        ? "native"
        : "cli";
    return { launcher, transport };
}
//# sourceMappingURL=codex-execution-surface.js.map