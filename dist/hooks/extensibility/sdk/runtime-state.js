import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { omxRootStateFilePath } from './paths.js';
import { getReadScopedStateFilePaths } from '../../../mcp/state-paths.js';
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
async function readOmxStateFile(path, normalize) {
    if (!existsSync(path))
        return null;
    try {
        const parsed = JSON.parse(await readFile(path, 'utf-8'));
        if (!isRecord(parsed))
            return null;
        return normalize ? normalize(parsed) : parsed;
    }
    catch {
        return null;
    }
}
function normalizeSessionState(value) {
    return typeof value.session_id === 'string' && value.session_id.trim()
        ? value
        : null;
}
export function createHookPluginOmxApi(cwd) {
    return {
        session: {
            read: () => readOmxStateFile(omxRootStateFilePath(cwd, 'session.json'), normalizeSessionState),
        },
        hud: {
            read: async () => {
                const [hudStatePath] = await getReadScopedStateFilePaths('hud-state.json', cwd, undefined, {
                    rootFallback: false,
                });
                return readOmxStateFile(hudStatePath);
            },
        },
        notifyFallback: {
            read: () => readOmxStateFile(omxRootStateFilePath(cwd, 'notify-fallback-state.json')),
        },
        updateCheck: {
            read: () => readOmxStateFile(omxRootStateFilePath(cwd, 'update-check.json')),
        },
    };
}
//# sourceMappingURL=runtime-state.js.map