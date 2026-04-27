import { type SkillActiveState } from "../hooks/keyword-detector.js";
import { reconcileHudForPromptSubmit } from "../hud/reconcile.js";
type CodexHookEventName = "SessionStart" | "PreToolUse" | "PostToolUse" | "UserPromptSubmit" | "Stop";
type CodexHookPayload = Record<string, unknown>;
interface NativeHookDispatchOptions {
    cwd?: string;
    sessionOwnerPid?: number;
    reconcileHudForPromptSubmitFn?: typeof reconcileHudForPromptSubmit;
}
export interface NativeHookDispatchResult {
    hookEventName: CodexHookEventName | null;
    omxEventName: string | null;
    skillState: SkillActiveState | null;
    outputJson: Record<string, unknown> | null;
}
export declare function mapCodexHookEventToOmxEvent(hookEventName: CodexHookEventName | null): string | null;
export declare function resolveSessionOwnerPidFromAncestry(startPid: number, options?: {
    readParentPid?: (pid: number) => number | null;
    readProcessCommand?: (pid: number) => string;
}): number | null;
export declare function dispatchCodexNativeHook(payload: CodexHookPayload, options?: NativeHookDispatchOptions): Promise<NativeHookDispatchResult>;
export declare function isCodexNativeHookMainModule(moduleUrl: string, argv1: string | undefined): boolean;
export declare function runCodexNativeHookCli(): Promise<void>;
export {};
//# sourceMappingURL=codex-native-hook.d.ts.map