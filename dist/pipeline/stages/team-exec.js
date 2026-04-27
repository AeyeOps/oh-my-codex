/**
 * Team execution stage adapter for pipeline orchestrator.
 *
 * Wraps the existing team mode (tmux-based Codex CLI workers) into a
 * PipelineStage. The execution backend is always teams — this is the
 * canonical OMX execution surface.
 */
import { buildFollowupStaffingPlan, resolveAvailableAgentTypes, } from '../../team/followup-planner.js';
/**
 * Create a team-exec pipeline stage.
 *
 * This stage delegates to the existing `omx team` infrastructure, which
 * starts real Codex CLI workers in tmux panes. The stage collects the
 * plan artifacts from the previous RALPLAN stage and passes them as
 * the team task description.
 */
export function createTeamExecStage(options = {}) {
    const workerCount = options.workerCount ?? 2;
    const agentType = options.agentType ?? 'executor';
    return {
        name: 'team-exec',
        async run(ctx) {
            const startTime = Date.now();
            try {
                // Extract plan context from previous stage artifacts
                const ralplanArtifacts = ctx.artifacts['ralplan'];
                const planContext = ralplanArtifacts
                    ? `Plan from RALPLAN stage:\n${JSON.stringify(ralplanArtifacts, null, 2)}\n\nTask: ${ctx.task}`
                    : ctx.task;
                const availableAgentTypes = await resolveAvailableAgentTypes(ctx.cwd);
                const staffingPlan = buildFollowupStaffingPlan('team', ctx.task, availableAgentTypes, {
                    workerCount,
                    fallbackRole: agentType,
                });
                // Build team execution descriptor
                const teamDescriptor = {
                    task: planContext,
                    workerCount,
                    agentType,
                    availableAgentTypes,
                    staffingPlan,
                    useWorktrees: options.useWorktrees ?? false,
                    cwd: ctx.cwd,
                    extraEnv: options.extraEnv,
                };
                return {
                    status: 'completed',
                    artifacts: {
                        teamDescriptor,
                        workerCount,
                        agentType,
                        availableAgentTypes,
                        staffingPlan,
                        stage: 'team-exec',
                        instruction: buildTeamInstruction(teamDescriptor),
                    },
                    duration_ms: Date.now() - startTime,
                };
            }
            catch (err) {
                return {
                    status: 'failed',
                    artifacts: {},
                    duration_ms: Date.now() - startTime,
                    error: `Team execution stage failed: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        },
    };
}
/**
 * Build the `omx team` CLI instruction from a descriptor.
 */
export function buildTeamInstruction(descriptor) {
    const launchCommand = `omx team ${descriptor.workerCount}:${descriptor.agentType} ${JSON.stringify(descriptor.task)}`;
    return `${launchCommand} # staffing=${descriptor.staffingPlan.staffingSummary} # verify=${descriptor.staffingPlan.verificationPlan.summary}`;
}
//# sourceMappingURL=team-exec.js.map