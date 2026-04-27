import type { TeamTask } from "./state.js";
import type { TeamReminderDirective } from "./reminder-intents.js";
interface WorkerRootAgentsOptions {
    teamName: string;
    workerName: string;
    workerRole: string;
    rolePromptContent: string;
    teamStateRoot: string;
    leaderCwd: string;
    worktreePath: string;
}
export declare function generateWorkerRootAgentsContent(options: WorkerRootAgentsOptions): string;
export declare function writeWorkerWorktreeRootAgentsFile(options: WorkerRootAgentsOptions): Promise<string>;
export declare function removeWorkerWorktreeRootAgentsFile(teamName: string, workerName: string, teamStateRoot: string, worktreePath: string): Promise<void>;
/**
 * Generate generic AGENTS.md overlay for team workers.
 * This is the SAME for all workers -- no per-worker identity.
 * Per-worker context goes in the inbox file.
 */
export declare function generateWorkerOverlay(teamName: string): string;
/**
 * Apply worker overlay to AGENTS.md. Idempotent -- strips existing overlay first.
 */
export declare function applyWorkerOverlay(agentsMdPath: string, overlay: string): Promise<void>;
/**
 * Strip worker overlay from AGENTS.md content. Idempotent.
 */
export declare function stripWorkerOverlay(agentsMdPath: string): Promise<void>;
/**
 * Write a team-scoped model instructions file that composes user-level
 * CODEX_HOME AGENTS.md, the project's AGENTS.md (if any), and the worker
 * overlay. This avoids mutating the source AGENTS.md files directly.
 *
 * Returns the absolute path to the composed file.
 */
export declare function writeTeamWorkerInstructionsFile(teamName: string, cwd: string, overlay: string): Promise<string>;
/**
 * Compose a per-worker startup instructions file by layering the team worker
 * instructions with the resolved role prompt content.
 */
export declare function writeWorkerRoleInstructionsFile(teamName: string, workerName: string, cwd: string, baseInstructionsPath: string, workerRole: string, rolePromptContent: string): Promise<string>;
/**
 * Remove the team-scoped model instructions file.
 */
export declare function removeTeamWorkerInstructionsFile(teamName: string, cwd: string): Promise<void>;
/**
 * Generate initial inbox file content for worker bootstrap.
 * This is written to .omx/state/team/{team}/workers/{worker}/inbox.md by the lead.
 */
export declare function generateInitialInbox(workerName: string, teamName: string, agentType: string, tasks: TeamTask[], options?: {
    teamStateRoot?: string;
    leaderCwd?: string;
    workerRole?: string;
    rolePromptContent?: string;
    worktreeRootAgentsCanonical?: boolean;
}): string;
/**
 * Generate inbox content for a follow-up task assignment.
 */
export declare function generateTaskAssignmentInbox(workerName: string, teamName: string, task: TeamTask): string;
export declare function generateTaskAssignmentInbox(workerName: string, teamName: string, taskId: string, taskDescription: string): string;
/**
 * Generate inbox content for shutdown.
 */
export declare function generateShutdownInbox(teamName: string, workerName: string): string;
/**
 * Generate the SHORT send-keys trigger message.
 * Always < 200 characters, ASCII-safe.
 */
export declare function generateTriggerMessage(workerName: string, teamName: string, teamStateRoot?: string): string;
export declare function buildTriggerDirective(workerName: string, teamName: string, teamStateRoot?: string): TeamReminderDirective;
/**
 * Generate a SHORT trigger for mailbox notifications.
 * Always < 200 characters, ASCII-safe.
 */
export declare function generateMailboxTriggerMessage(workerName: string, teamName: string, count: number, teamStateRoot?: string): string;
export declare function buildMailboxTriggerDirective(workerName: string, teamName: string, count: number, teamStateRoot?: string): TeamReminderDirective;
export declare function generateLeaderMailboxTriggerMessage(teamName: string, fromWorker: string, teamStateRoot?: string): string;
export declare function buildLeaderMailboxTriggerDirective(teamName: string, fromWorker: string, teamStateRoot?: string): TeamReminderDirective;
export {};
//# sourceMappingURL=worker-bootstrap.d.ts.map