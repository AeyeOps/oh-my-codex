import type { HookPluginSdk } from '../types.js';
export declare function normalizeHookPluginStateKey(key: string): string;
export declare function createHookPluginStateApi(cwd: string, pluginName: string): HookPluginSdk['state'];
export declare function clearHookPluginStateFiles(cwd: string, pluginName: string): Promise<void>;
//# sourceMappingURL=plugin-state.d.ts.map