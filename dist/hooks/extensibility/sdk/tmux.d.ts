import type { HookEventEnvelope, HookPluginSdk } from '../types.js';
interface HookPluginTmuxApiOptions {
    cwd: string;
    pluginName: string;
    event: HookEventEnvelope;
    sideEffectsEnabled?: boolean;
}
export declare function createHookPluginTmuxApi(options: HookPluginTmuxApiOptions): HookPluginSdk['tmux'];
export {};
//# sourceMappingURL=tmux.d.ts.map