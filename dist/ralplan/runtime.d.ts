export declare const RALPLAN_ACTIVE_PHASES: readonly ["draft", "architect-review", "critic-review", "complete"];
export type RalplanActivePhase = (typeof RALPLAN_ACTIVE_PHASES)[number];
export type RalplanTerminalPhase = 'complete' | 'cancelled' | 'failed';
export type RalplanReviewVerdict = 'approve' | 'iterate' | 'reject';
export interface RalplanDraftResult {
    summary?: string;
    planPath?: string;
    artifacts?: Record<string, unknown>;
}
export interface RalplanReviewResult {
    verdict: RalplanReviewVerdict;
    summary?: string;
    artifacts?: Record<string, unknown>;
}
export interface RalplanConsensusIterationContext {
    task: string;
    cwd: string;
    iteration: number;
    priorDrafts: RalplanDraftResult[];
    architectReviews: RalplanReviewResult[];
    criticReviews: RalplanReviewResult[];
}
export interface RalplanConsensusExecutor {
    draft(ctx: RalplanConsensusIterationContext): Promise<RalplanDraftResult>;
    architectReview(ctx: RalplanConsensusIterationContext & {
        draft: RalplanDraftResult;
    }): Promise<RalplanReviewResult>;
    criticReview(ctx: RalplanConsensusIterationContext & {
        draft: RalplanDraftResult;
        architectReview: RalplanReviewResult;
    }): Promise<RalplanReviewResult>;
}
export interface RunRalplanConsensusOptions {
    task: string;
    cwd?: string;
    maxIterations?: number;
}
export interface RalplanRuntimeResult {
    status: 'completed' | 'failed' | 'cancelled';
    iteration: number;
    phase: RalplanTerminalPhase;
    planningComplete: boolean;
    drafts: RalplanDraftResult[];
    architectReviews: RalplanReviewResult[];
    criticReviews: RalplanReviewResult[];
    latestPlanPath?: string;
    artifacts: Record<string, unknown>;
    error?: string;
}
export declare function runRalplanConsensus(executor: RalplanConsensusExecutor, options: RunRalplanConsensusOptions): Promise<RalplanRuntimeResult>;
export declare function cancelRalplanConsensus(cwd?: string): Promise<void>;
//# sourceMappingURL=runtime.d.ts.map