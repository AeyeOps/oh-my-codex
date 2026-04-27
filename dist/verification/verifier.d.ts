/**
 * Verification Protocol for oh-my-codex
 *
 * Evidence-backed verification of task completion.
 * Sizing: small (low), standard (medium), large (high)
 */
export interface VerificationResult {
    passed: boolean;
    evidence: VerificationEvidence[];
    summary: string;
    confidence: 'high' | 'medium' | 'low';
}
export interface VerificationEvidence {
    type: 'test' | 'typecheck' | 'lint' | 'build' | 'manual' | 'runtime';
    passed: boolean;
    command?: string;
    output?: string;
    details?: string;
}
/**
 * Heuristic check for structured verification evidence in a task completion summary.
 * Intended for runtime completion gating (best-effort, backward-compatible).
 */
export declare function hasStructuredVerificationEvidence(summary: string | null | undefined): boolean;
/**
 * Generate verification instructions for a given task size
 */
export declare function getVerificationInstructions(taskSize: 'small' | 'standard' | 'large', taskDescription: string): string;
/**
 * Determine task size from file count and line changes
 */
export declare function determineTaskSize(fileCount: number, lineChanges: number): 'small' | 'standard' | 'large';
/**
 * Generate the verification fix-loop instructions
 */
export declare function getFixLoopInstructions(maxRetries?: number): string;
//# sourceMappingURL=verifier.d.ts.map