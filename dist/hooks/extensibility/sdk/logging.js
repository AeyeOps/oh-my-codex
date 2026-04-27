import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { hookPluginLogPath } from './paths.js';
export async function appendHookPluginLog(cwd, pluginName, level, message, meta) {
    const logPath = hookPluginLogPath(cwd);
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, `${JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'hook_plugin_log',
        plugin: pluginName,
        level,
        message,
        ...meta,
    })}\n`).catch(() => { });
}
export function createHookPluginLogger(cwd, pluginName, event) {
    return {
        info: (message, meta = {}) => appendHookPluginLog(cwd, pluginName, 'info', message, {
            hook_event: event.event,
            ...meta,
        }),
        warn: (message, meta = {}) => appendHookPluginLog(cwd, pluginName, 'warn', message, {
            hook_event: event.event,
            ...meta,
        }),
        error: (message, meta = {}) => appendHookPluginLog(cwd, pluginName, 'error', message, {
            hook_event: event.event,
            ...meta,
        }),
    };
}
//# sourceMappingURL=logging.js.map