import type { HookEventEnvelope, HookPluginSdk } from '../types.js';
type HookPluginLogLevel = 'info' | 'warn' | 'error';
export declare function appendHookPluginLog(cwd: string, pluginName: string, level: HookPluginLogLevel, message: string, meta: Record<string, unknown>): Promise<void>;
export declare function createHookPluginLogger(cwd: string, pluginName: string, event: HookEventEnvelope): HookPluginSdk['log'];
export {};
//# sourceMappingURL=logging.d.ts.map