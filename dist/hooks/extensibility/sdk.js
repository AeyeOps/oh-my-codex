import { createHookPluginLogger } from './sdk/logging.js';
import { clearHookPluginStateFiles, createHookPluginStateApi } from './sdk/plugin-state.js';
import { sanitizeHookPluginName } from './sdk/paths.js';
import { createHookPluginOmxApi } from './sdk/runtime-state.js';
import { createHookPluginTmuxApi } from './sdk/tmux.js';
export function createHookPluginSdk(options) {
    const pluginName = sanitizeHookPluginName(options.pluginName);
    return {
        tmux: createHookPluginTmuxApi({
            ...options,
            pluginName,
        }),
        log: createHookPluginLogger(options.cwd, pluginName, options.event),
        state: createHookPluginStateApi(options.cwd, pluginName),
        omx: createHookPluginOmxApi(options.cwd),
    };
}
export async function clearHookPluginState(cwd, pluginName) {
    await clearHookPluginStateFiles(cwd, pluginName);
}
//# sourceMappingURL=sdk.js.map