export declare const MANAGED_HOOK_EVENTS: readonly ["SessionStart", "PreToolUse", "PostToolUse", "UserPromptSubmit", "Stop"];
type ManagedHookEventName = (typeof MANAGED_HOOK_EVENTS)[number];
type JsonObject = Record<string, unknown>;
export interface ManagedCodexHooksConfig {
    hooks: Record<ManagedHookEventName, Array<Record<string, unknown>>>;
}
interface ParsedCodexHooksConfig {
    root: JsonObject;
    hooks: JsonObject;
}
export interface RemoveManagedCodexHooksResult {
    nextContent: string | null;
    removedCount: number;
}
export declare function buildManagedCodexHooksConfig(pkgRoot: string): ManagedCodexHooksConfig;
export declare function parseCodexHooksConfig(content: string): ParsedCodexHooksConfig | null;
export declare function getMissingManagedCodexHookEvents(content: string): ManagedHookEventName[] | null;
export declare function mergeManagedCodexHooksConfig(existingContent: string | null | undefined, pkgRoot: string): string;
export declare function removeManagedCodexHooks(existingContent: string): RemoveManagedCodexHooksResult;
export {};
//# sourceMappingURL=codex-hooks.d.ts.map