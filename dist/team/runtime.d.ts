import { type TeamWorkerCli, type TeamSession } from './tmux-session.js';
import { type TeamConfig, type WorkerHeartbeat, type WorkerStatus, type TeamTask } from './team-ops.js';
import { type DispatchOutcome } from './mcp-comm.js';
import { type TeamPhase, type TerminalPhase } from './orchestrator.js';
import { TEAM_LOW_COMPLEXITY_DEFAULT_MODEL, type TeamReasoningEffort } from './model-contract.js';
import { resolveCanonicalTeamStateRoot } from './state-root.js';
import { type TeamCommitHygieneArtifactPaths } from './commit-hygiene.js';
import { type WorktreeMode } from './worktree.js';
import { type CleanupResult } from '../cli/cleanup.js';
/** Snapshot of the team state at a point in time */
export interface TeamSnapshot {
    teamName: string;
    phase: TeamPhase | TerminalPhase;
    workers: Array<{
        name: string;
        alive: boolean;
        status: WorkerStatus;
        heartbeat: WorkerHeartbeat | null;
        assignedTasks: string[];
        turnsWithoutProgress: number;
    }>;
    tasks: {
        total: number;
        pending: number;
        blocked: number;
        in_progress: number;
        completed: number;
        failed: number;
        items: TeamTask[];
    };
    allTasksTerminal: boolean;
    deadWorkers: string[];
    nonReportingWorkers: string[];
    recommendations: string[];
    performance?: {
        list_tasks_ms: number;
        worker_scan_ms: number;
        mailbox_delivery_ms: number;
        total_ms: number;
        updated_at: string;
    };
}
/** Runtime handle returned by startTeam */
export interface TeamRuntime {
    teamName: string;
    sanitizedName: string;
    sessionName: string;
    config: TeamConfig;
    cwd: string;
}
interface ShutdownOptions {
    force?: boolean;
    confirmIssues?: boolean;
}
export interface TeamShutdownSummary {
    commitHygieneArtifacts: TeamCommitHygieneArtifactPaths | null;
}
export declare function applyCreatedInteractiveSessionToConfig(config: TeamConfig, createdSession: TeamSession, workerPaneIds: Array<string | undefined>): void;
export declare function shouldPrekillInteractiveShutdownProcessTrees(sessionName: string): boolean;
export declare function cleanupTeamWorkerLaunchOrphanedMcpProcesses(dependencies?: {
    cleanup?: () => Promise<CleanupResult>;
    writeWarning?: (message: string) => void;
}): Promise<void>;
export interface StaleTeamSummary {
    teamName: string;
    worktreePaths: string[];
    statePath: string;
    hasDirtyWorktrees: boolean;
}
export interface TeamStartOptions {
    worktreeMode?: WorktreeMode;
    confirmStaleCleanup?: (summary: StaleTeamSummary) => Promise<boolean>;
    cleanupLaunchOrphanedMcpProcesses?: () => Promise<CleanupResult>;
    writeCleanupWarning?: (message: string) => void;
}
type WorkerStartupEvidence = 'task_claim' | 'worker_progress' | 'leader_ack' | 'none';
export declare function waitForWorkerStartupEvidence(params: {
    teamName: string;
    workerName: string;
    workerCli: TeamWorkerCli;
    cwd: string;
    timeoutMs?: number;
    pollMs?: number;
}): Promise<WorkerStartupEvidence>;
export declare function waitForClaudeStartupEvidence(params: {
    teamName: string;
    workerName: string;
    cwd: string;
    timeoutMs?: number;
    pollMs?: number;
}): Promise<WorkerStartupEvidence>;
export { TEAM_LOW_COMPLEXITY_DEFAULT_MODEL };
export { resolveCanonicalTeamStateRoot };
export declare function resolveWorkerLaunchArgsFromEnv(env: NodeJS.ProcessEnv, agentType: string, inheritedLeaderModel?: string, preferredReasoning?: TeamReasoningEffort, workerCliOverride?: TeamWorkerCli): string[];
/**
 * Start a new team: init state, create tmux session, bootstrap workers.
 */
export type StartupAttemptResult = {
    ok: true;
    workerIndex: number;
    workerName: string;
} | {
    ok: false;
    workerIndex: number;
    workerName: string;
    error: Error;
};
export interface StartupAttemptDescriptor {
    workerIndex: number;
    workerName: string;
    attempt: Promise<StartupAttemptResult>;
}
export declare function settleStartupAttemptResults(attempts: readonly StartupAttemptDescriptor[]): Promise<StartupAttemptResult[]>;
export declare function startTeam(teamName: string, task: string, agentType: string, workerCount: number, tasks: Array<{
    subject: string;
    description: string;
    owner?: string;
    blocked_by?: string[];
    role?: string;
    delegation?: TeamTask['delegation'];
}>, cwd: string, options?: TeamStartOptions): Promise<TeamRuntime>;
/**
 * Monitor team state by polling files. Returns a snapshot.
 */
export declare function monitorTeam(teamName: string, cwd: string): Promise<TeamSnapshot | null>;
/**
 * Assign a task to a worker by writing inbox and sending trigger.
 */
export declare function assignTask(teamName: string, workerName: string, taskId: string, cwd: string): Promise<void>;
/**
 * Reassign a task from one worker to another.
 */
export declare function reassignTask(teamName: string, taskId: string, _fromWorker: string, toWorker: string, cwd: string): Promise<void>;
/**
 * Graceful shutdown: send shutdown inbox to all workers, wait, force kill, cleanup.
 */
export declare function shutdownTeam(teamName: string, cwd: string, options?: ShutdownOptions): Promise<TeamShutdownSummary>;
/**
 * Resume monitoring an existing team.
 */
export declare function resumeTeam(teamName: string, cwd: string): Promise<TeamRuntime | null>;
export declare function sendWorkerMessage(teamName: string, fromWorker: string, toWorker: string, body: string, cwd: string): Promise<DispatchOutcome>;
export declare function broadcastWorkerMessage(teamName: string, fromWorker: string, body: string, cwd: string): Promise<void>;
//# sourceMappingURL=runtime.d.ts.map