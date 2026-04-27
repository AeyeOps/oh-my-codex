import type { HookPluginDescriptor } from './types.js';
export declare const HOOK_PLUGIN_ENABLE_ENV = "OMX_HOOK_PLUGINS";
export declare const HOOK_PLUGIN_TIMEOUT_ENV = "OMX_HOOK_PLUGIN_TIMEOUT_MS";
export declare function hooksDir(cwd: string): string;
export declare function isHookPluginsEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function resolveHookPluginTimeoutMs(env?: NodeJS.ProcessEnv, fallback?: number): number;
export declare function ensureHooksDir(cwd: string): Promise<string>;
export declare function validateHookPluginExport(pluginPath: string): Promise<{
    valid: boolean;
    reason?: string;
}>;
export declare function discoverHookPlugins(cwd: string): Promise<HookPluginDescriptor[]>;
export declare function loadHookPluginDescriptors(cwd: string): Promise<HookPluginDescriptor[]>;
//# sourceMappingURL=loader.d.ts.map