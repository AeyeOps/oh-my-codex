export declare const RALPH_PHASES: readonly ["starting", "executing", "verifying", "fixing", "blocked_on_user", "complete", "failed", "cancelled"];
export type RalphPhase = typeof RALPH_PHASES[number];
export interface RalphStateValidationResult {
    ok: boolean;
    state?: Record<string, unknown>;
    warning?: string;
    error?: string;
}
export declare function normalizeRalphPhase(rawPhase: unknown): {
    phase?: RalphPhase;
    warning?: string;
    error?: string;
};
export declare function validateAndNormalizeRalphState(candidate: Record<string, unknown>, options?: {
    nowIso?: string;
}): RalphStateValidationResult;
//# sourceMappingURL=contract.d.ts.map