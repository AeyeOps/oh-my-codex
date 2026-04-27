import { join } from 'path';
export function sanitizeHookPluginName(name) {
    const cleaned = (name || 'unknown-plugin').replace(/[^a-zA-Z0-9._-]/g, '-');
    return cleaned || 'unknown-plugin';
}
export function hookPluginRootDir(cwd, pluginName) {
    return join(cwd, '.omx', 'state', 'hooks', 'plugins', sanitizeHookPluginName(pluginName));
}
export function hookPluginTmuxStatePath(cwd, pluginName) {
    return join(hookPluginRootDir(cwd, pluginName), 'tmux.json');
}
export function hookPluginDataPath(cwd, pluginName) {
    return join(hookPluginRootDir(cwd, pluginName), 'data.json');
}
export function hookPluginLogPath(cwd, now = new Date()) {
    const day = now.toISOString().slice(0, 10);
    return join(cwd, '.omx', 'logs', `hooks-${day}.jsonl`);
}
export function omxRootStateFilePath(cwd, fileName) {
    return join(cwd, '.omx', 'state', fileName);
}
//# sourceMappingURL=paths.js.map