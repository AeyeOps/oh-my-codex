import type { HookEventEnvelope, HookPluginSdk } from './types.js';
interface HookPluginSdkOptions {
    cwd: string;
    pluginName: string;
    event: HookEventEnvelope;
    sideEffectsEnabled?: boolean;
}
export declare function createHookPluginSdk(options: HookPluginSdkOptions): HookPluginSdk;
export declare function clearHookPluginState(cwd: string, pluginName: string): Promise<void>;
export {};
//# sourceMappingURL=sdk.d.ts.map