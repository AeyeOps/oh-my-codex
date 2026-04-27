type CodexHookEventName = "SessionStart" | "PreToolUse" | "PostToolUse" | "UserPromptSubmit" | "Stop";
type CodexHookPayload = Record<string, unknown>;
export type CodexLauncherKind = "native" | "cli";
export type CodexTransportKind = "attached-tmux" | "outside-tmux";
export interface CodexExecutionSurface {
    launcher: CodexLauncherKind;
    transport: CodexTransportKind;
}
export declare function resolveCodexExecutionSurface(cwd: string, options?: {
    hookEventName?: CodexHookEventName | null;
    payload?: CodexHookPayload;
    canonicalSessionId?: string;
    nativeSessionId?: string;
}): CodexExecutionSurface;
export {};
//# sourceMappingURL=codex-execution-surface.d.ts.map