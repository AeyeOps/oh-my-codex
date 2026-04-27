/**
 * Ralph verification stage adapter for pipeline orchestrator.
 *
 * Wraps the ralph persistence loop into a PipelineStage for the
 * verification phase. Uses configurable iteration count.
 */
import type { PipelineStage } from '../types.js';
import { buildFollowupStaffingPlan } from '../../team/followup-planner.js';
export interface RalphVerifyStageOptions {
    /**
     * Maximum number of ralph verification iterations.
     * Defaults to 10.
     */
    maxIterations?: number;
}
/**
 * Create a ralph-verify pipeline stage.
 *
 * This stage wraps the ralph persistence loop for the verification phase
 * of the pipeline. It takes the execution results from team-exec and
 * orchestrates architect-verified completion.
 *
 * The iteration count is configurable, addressing issue #396 requirement
 * for configurable ralph iteration count.
 */
export declare function createRalphVerifyStage(options?: RalphVerifyStageOptions): PipelineStage;
/**
 * Descriptor for a ralph verification run, consumed by the ralph runtime.
 */
export interface RalphVerifyDescriptor {
    task: string;
    maxIterations: number;
    cwd: string;
    sessionId?: string;
    availableAgentTypes: string[];
    staffingPlan: ReturnType<typeof buildFollowupStaffingPlan>;
    executionArtifacts: Record<string, unknown>;
}
/**
 * Build the ralph CLI instruction from a descriptor.
 */
export declare function buildRalphInstruction(descriptor: RalphVerifyDescriptor): string;
//# sourceMappingURL=ralph-verify.d.ts.map