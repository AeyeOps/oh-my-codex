export declare const TEAM_LOW_COMPLEXITY_DEFAULT_MODEL = "gpt-5.3-codex-spark";
export type TeamReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh';
export interface ParsedTeamWorkerLaunchArgs {
    passthrough: string[];
    wantsBypass: boolean;
    reasoningOverride: string | null;
    modelOverride: string | null;
}
export interface ResolveTeamWorkerLaunchArgsOptions {
    existingRaw?: string;
    inheritedArgs?: string[];
    fallbackModel?: string;
    preferredReasoning?: TeamReasoningEffort;
}
export declare function splitWorkerLaunchArgs(raw: string | undefined): string[];
export declare function parseTeamWorkerLaunchArgs(args: string[]): ParsedTeamWorkerLaunchArgs;
export declare function collectInheritableTeamWorkerArgs(codexArgs: string[]): string[];
export declare function normalizeTeamWorkerLaunchArgs(args: string[], preferredModel?: string, preferredReasoning?: TeamReasoningEffort): string[];
export declare function resolveTeamWorkerLaunchArgs(options: ResolveTeamWorkerLaunchArgsOptions): string[];
export declare function resolveAgentReasoningEffort(agentType?: string): TeamReasoningEffort | undefined;
export declare function resolveAgentDefaultModel(agentType?: string, codexHomeOverride?: string): string | undefined;
export declare function isLowComplexityAgentType(agentType?: string): boolean;
export declare function resolveTeamLowComplexityDefaultModel(codexHomeOverride?: string): string;
//# sourceMappingURL=model-contract.d.ts.map