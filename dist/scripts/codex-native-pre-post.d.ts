type CodexHookPayload = Record<string, unknown>;
type GitRepositorySelection = "current-cwd" | "explicit-target";
export interface NormalizedPreToolUsePayload {
    toolName: string;
    toolUseId: string;
    command: string;
    normalizedCommand: string;
    isBash: boolean;
}
export interface NormalizedPostToolUsePayload {
    toolName: string;
    toolUseId: string;
    command: string;
    normalizedCommand: string;
    isBash: boolean;
    rawToolResponse: unknown;
    parsedToolResponse: Record<string, unknown> | null;
    exitCode: number | null;
    stdoutText: string;
    stderrText: string;
}
export interface McpTransportFailureSignal {
    toolName: string;
    summary: string;
}
export declare function normalizePreToolUsePayload(payload: CodexHookPayload): NormalizedPreToolUsePayload;
export declare function normalizePostToolUsePayload(payload: CodexHookPayload): NormalizedPostToolUsePayload;
export declare function detectMcpTransportFailure(payload: CodexHookPayload): McpTransportFailureSignal | null;
interface GitCommitCommandParseResult {
    isGitCommit: boolean;
    inlineMessage: string | null;
    repositorySelection: GitRepositorySelection;
    requiresExternalMessageSource: boolean;
}
export declare function parseGitCommitCommand(commandText: string): GitCommitCommandParseResult;
export declare function buildNativePreToolUseOutput(payload: CodexHookPayload): Record<string, unknown> | null;
export declare function buildNativePostToolUseOutput(payload: CodexHookPayload): Record<string, unknown> | null;
export {};
//# sourceMappingURL=codex-native-pre-post.d.ts.map