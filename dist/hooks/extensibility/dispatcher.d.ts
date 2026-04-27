import type { HookDispatchOptions, HookDispatchResult, HookEventEnvelope } from "./types.js";
export declare function isHookPluginFeatureEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function dispatchHookEvent(event: HookEventEnvelope, options?: HookDispatchOptions): Promise<HookDispatchResult>;
//# sourceMappingURL=dispatcher.d.ts.map