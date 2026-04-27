/**
 * Team execution stage adapter for pipeline orchestrator.
 *
 * Wraps the existing team mode (tmux-based Codex CLI workers) into a
 * PipelineStage. The execution backend is always teams — this is the
 * canonical OMX execution surface.
 */
import type { PipelineStage } from '../types.js';
import { buildFollowupStaffingPlan } from '../../team/followup-planner.js';
export interface TeamExecStageOptions {
    /** Number of Codex CLI workers to launch. Defaults to 2. */
    workerCount?: number;
    /** Agent type/role for workers. Defaults to 'executor'. */
    agentType?: string;
    /** Whether to use git worktrees for worker isolation. */
    useWorktrees?: boolean;
    /** Additional environment variables for worker launch. */
    extraEnv?: Record<string, string>;
}
/**
 * Create a team-exec pipeline stage.
 *
 * This stage delegates to the existing `omx team` infrastructure, which
 * starts real Codex CLI workers in tmux panes. The stage collects the
 * plan artifacts from the previous RALPLAN stage and passes them as
 * the team task description.
 */
export declare function createTeamExecStage(options?: TeamExecStageOptions): PipelineStage;
/**
 * Descriptor for a team execution run, consumed by the team runtime.
 */
export interface TeamExecDescriptor {
    task: string;
    workerCount: number;
    agentType: string;
    availableAgentTypes: string[];
    staffingPlan: ReturnType<typeof buildFollowupStaffingPlan>;
    useWorktrees: boolean;
    cwd: string;
    extraEnv?: Record<string, string>;
}
/**
 * Build the `omx team` CLI instruction from a descriptor.
 */
export declare function buildTeamInstruction(descriptor: TeamExecDescriptor): string;
//# sourceMappingURL=team-exec.d.ts.map