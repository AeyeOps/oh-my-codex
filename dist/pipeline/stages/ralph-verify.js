/**
 * Ralph verification stage adapter for pipeline orchestrator.
 *
 * Wraps the ralph persistence loop into a PipelineStage for the
 * verification phase. Uses configurable iteration count.
 */
import { buildFollowupStaffingPlan, resolveAvailableAgentTypes, } from '../../team/followup-planner.js';
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
export function createRalphVerifyStage(options = {}) {
    const maxIterations = options.maxIterations ?? 10;
    return {
        name: 'ralph-verify',
        async run(ctx) {
            const startTime = Date.now();
            try {
                // Extract execution context from previous stage
                const teamArtifacts = ctx.artifacts['team-exec'];
                const availableAgentTypes = await resolveAvailableAgentTypes(ctx.cwd);
                const staffingPlan = buildFollowupStaffingPlan('ralph', ctx.task, availableAgentTypes, {
                    workerCount: Math.min(maxIterations, 3),
                });
                // Build ralph verification descriptor
                const verifyDescriptor = {
                    task: ctx.task,
                    maxIterations,
                    cwd: ctx.cwd,
                    sessionId: ctx.sessionId,
                    availableAgentTypes,
                    staffingPlan,
                    executionArtifacts: teamArtifacts ?? {},
                };
                return {
                    status: 'completed',
                    artifacts: {
                        verifyDescriptor,
                        maxIterations,
                        availableAgentTypes,
                        staffingPlan,
                        stage: 'ralph-verify',
                        instruction: buildRalphInstruction(verifyDescriptor),
                    },
                    duration_ms: Date.now() - startTime,
                };
            }
            catch (err) {
                return {
                    status: 'failed',
                    artifacts: {},
                    duration_ms: Date.now() - startTime,
                    error: `Ralph verification stage failed: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        },
    };
}
/**
 * Build the ralph CLI instruction from a descriptor.
 */
export function buildRalphInstruction(descriptor) {
    return `${descriptor.staffingPlan.launchHints.shellCommand} # max_iterations=${descriptor.maxIterations} # staffing=${descriptor.staffingPlan.staffingSummary} # verify=${descriptor.staffingPlan.verificationPlan.summary}`;
}
//# sourceMappingURL=ralph-verify.js.map