import { rename } from 'fs/promises';
import { type TeamPhase, type TerminalPhase } from './orchestrator.js';
import { type TeamDispatchRequestStatus, type TeamWorkerIntegrationStatus, type TeamEventType } from './contracts.js';
import type { TeamReminderIntent } from './reminder-intents.js';
import type { WorktreeMode } from './worktree.js';
export type { TeamDispatchRequestStatus, TeamWorkerIntegrationStatus } from './contracts.js';
export interface TeamConfig {
    name: string;
    task: string;
    agent_type: string;
    worker_launch_mode: 'interactive' | 'prompt';
    lifecycle_profile: 'default';
    worker_count: number;
    max_workers: number;
    workers: WorkerInfo[];
    created_at: string;
    tmux_session: string;
    next_task_id: number;
    leader_cwd?: string;
    team_state_root?: string;
    workspace_mode?: 'single' | 'worktree';
    worktree_mode?: WorktreeMode;
    /** Leader's own tmux pane ID — must never be killed during worker cleanup. */
    leader_pane_id: string | null;
    /** HUD pane spawned below the leader column — excluded from worker pane cleanup. */
    hud_pane_id: string | null;
    /** Registered HUD resize hook name used for window-size reconciliation. */
    resize_hook_name: string | null;
    /** Registered HUD resize hook target in "<session>:<window>" form. */
    resize_hook_target: string | null;
    /** Monotonic counter for worker index assignment during scaling. */
    next_worker_index?: number;
}
export interface WorkerInfo {
    name: string;
    index: number;
    role: string;
    worker_cli?: 'codex' | 'claude' | 'gemini';
    assigned_tasks: string[];
    pid?: number;
    pane_id?: string;
    working_dir?: string;
    worktree_repo_root?: string;
    worktree_path?: string;
    worktree_branch?: string;
    worktree_detached?: boolean;
    worktree_created?: boolean;
    team_state_root?: string;
}
export interface WorkerHeartbeat {
    pid: number;
    last_turn_at: string;
    turn_count: number;
    alive: boolean;
}
export interface WorkerStatus {
    state: 'idle' | 'working' | 'blocked' | 'done' | 'failed' | 'draining' | 'unknown';
    current_task_id?: string;
    reason?: string;
    updated_at: string;
}
export type TeamTaskDelegationMode = 'none' | 'optional' | 'auto' | 'required';
export type TeamTaskChildModelPolicy = 'standard' | 'fast' | 'inherit' | 'frontier';
export interface TeamTaskDelegationPlan {
    mode: TeamTaskDelegationMode;
    max_parallel_subtasks?: number;
    required_parallel_probe?: boolean;
    spawn_before_serial_search_threshold?: number;
    child_model_policy?: TeamTaskChildModelPolicy;
    child_model?: string;
    subtask_candidates?: string[];
    child_report_format?: 'bullets' | 'json';
    skip_allowed_reason_required?: boolean;
}
export interface TeamTask {
    id: string;
    subject: string;
    description: string;
    status: 'pending' | 'blocked' | 'in_progress' | 'completed' | 'failed';
    requires_code_change?: boolean;
    role?: string;
    owner?: string;
    result?: string;
    error?: string;
    blocked_by?: string[];
    depends_on?: string[];
    version?: number;
    claim?: TeamTaskClaim;
    created_at: string;
    completed_at?: string;
    delegation?: TeamTaskDelegationPlan;
}
export interface TeamTaskClaim {
    owner: string;
    token: string;
    leased_until: string;
}
export interface TeamTaskV2 extends TeamTask {
    version: number;
}
export interface TeamLeader {
    session_id: string;
    thread_id?: string;
    worker_id: string;
    role: string;
}
export interface TeamPolicy {
    display_mode: 'split_pane' | 'auto';
    worker_launch_mode: 'interactive' | 'prompt';
    dispatch_mode: 'hook_preferred_with_fallback' | 'transport_direct';
    dispatch_ack_timeout_ms: number;
}
/**
 * Lifecycle/workflow guardrails persisted alongside the manifest, but kept
 * separate from transport/runtime policy so each layer has a single owner.
 */
export interface TeamGovernance {
    delegation_only: boolean;
    plan_approval_required: boolean;
    nested_teams_allowed: boolean;
    one_team_per_leader_session: boolean;
    cleanup_requires_all_workers_inactive: boolean;
}
export type TeamDispatchRequestKind = 'inbox' | 'mailbox' | 'nudge';
export type TeamDispatchTransportPreference = 'hook_preferred_with_fallback' | 'transport_direct' | 'prompt_stdin';
export interface TeamDispatchRequest {
    request_id: string;
    kind: TeamDispatchRequestKind;
    team_name: string;
    to_worker: string;
    worker_index?: number;
    pane_id?: string;
    trigger_message: string;
    intent?: TeamReminderIntent;
    message_id?: string;
    inbox_correlation_key?: string;
    transport_preference: TeamDispatchTransportPreference;
    fallback_allowed: boolean;
    status: TeamDispatchRequestStatus;
    attempt_count: number;
    created_at: string;
    updated_at: string;
    notified_at?: string;
    delivered_at?: string;
    failed_at?: string;
    last_reason?: string;
}
export interface TeamDispatchRequestInput {
    kind: TeamDispatchRequestKind;
    to_worker: string;
    worker_index?: number;
    pane_id?: string;
    trigger_message: string;
    intent?: TeamReminderIntent;
    message_id?: string;
    inbox_correlation_key?: string;
    transport_preference?: TeamDispatchTransportPreference;
    fallback_allowed?: boolean;
    last_reason?: string;
}
export interface PermissionsSnapshot {
    approval_mode: string;
    sandbox_mode: string;
    network_access: boolean;
}
export interface TeamManifestV2 {
    schema_version: 2;
    name: string;
    task: string;
    leader: TeamLeader;
    policy: TeamPolicy;
    governance: TeamGovernance;
    lifecycle_profile: 'default';
    permissions_snapshot: PermissionsSnapshot;
    tmux_session: string;
    worker_count: number;
    workers: WorkerInfo[];
    next_task_id: number;
    created_at: string;
    leader_cwd?: string;
    team_state_root?: string;
    workspace_mode?: 'single' | 'worktree';
    worktree_mode?: WorktreeMode;
    leader_pane_id: string | null;
    hud_pane_id: string | null;
    resize_hook_name: string | null;
    resize_hook_target: string | null;
    /** Monotonic counter for worker index assignment during scaling. */
    next_worker_index?: number;
}
export interface TeamWorkspaceMetadata {
    leader_cwd?: string;
    team_state_root?: string;
    workspace_mode?: 'single' | 'worktree';
    worktree_mode?: WorktreeMode;
}
export interface TeamEvent {
    event_id: string;
    team: string;
    type: TeamEventType;
    worker: string;
    task_id?: string;
    message_id?: string | null;
    reason?: string;
    intent?: TeamReminderIntent;
    state?: WorkerStatus['state'];
    prev_state?: WorkerStatus['state'];
    worker_count?: number;
    to_worker?: string;
    source_type?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    [key: string]: unknown;
}
export interface TeamMailboxMessage {
    message_id: string;
    from_worker: string;
    to_worker: string;
    body: string;
    created_at: string;
    notified_at?: string;
    delivered_at?: string;
}
export interface TeamMailbox {
    worker: string;
    messages: TeamMailboxMessage[];
}
export interface TaskApprovalRecord {
    task_id: string;
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
    reviewer: string;
    decision_reason: string;
    decided_at: string;
}
export declare function setWriteAtomicRenameForTests(fn: typeof rename): void;
export declare function resetWriteAtomicRenameForTests(): void;
export type TaskReadiness = {
    ready: true;
} | {
    ready: false;
    reason: 'blocked_dependency';
    dependencies: string[];
};
export type ClaimTaskResult = {
    ok: true;
    task: TeamTaskV2;
    claimToken: string;
} | {
    ok: false;
    error: 'claim_conflict' | 'blocked_dependency' | 'task_not_found' | 'already_terminal' | 'worker_not_found';
    dependencies?: string[];
};
export type TransitionTaskResult = {
    ok: true;
    task: TeamTaskV2;
} | {
    ok: false;
    error: 'claim_conflict' | 'invalid_transition' | 'task_not_found' | 'already_terminal' | 'lease_expired';
};
export type ReleaseTaskClaimResult = {
    ok: true;
    task: TeamTaskV2;
} | {
    ok: false;
    error: 'claim_conflict' | 'task_not_found' | 'already_terminal' | 'lease_expired';
};
export type ReclaimTaskResult = {
    ok: true;
    task: TeamTaskV2;
    reclaimed: boolean;
} | {
    ok: false;
    error: 'claim_conflict' | 'task_not_found' | 'already_terminal' | 'lease_active';
};
export interface TeamSummary {
    teamName: string;
    workerCount: number;
    tasks: {
        total: number;
        pending: number;
        blocked: number;
        in_progress: number;
        completed: number;
        failed: number;
    };
    workers: Array<{
        name: string;
        alive: boolean;
        lastTurnAt: string | null;
        turnsWithoutProgress: number;
    }>;
    nonReportingWorkers: string[];
    performance?: TeamSummaryPerformance;
}
export interface TeamSummaryPerformance {
    total_ms: number;
    tasks_loaded_ms: number;
    workers_polled_ms: number;
    task_count: number;
    worker_count: number;
}
export declare const DEFAULT_MAX_WORKERS = 20;
export declare const ABSOLUTE_MAX_WORKERS = 20;
export declare function normalizeTeamPolicy(policy: Partial<TeamPolicy> | null | undefined, defaults?: Pick<TeamPolicy, 'display_mode' | 'worker_launch_mode'>): TeamPolicy;
export declare function normalizeTeamGovernance(governance: Partial<TeamGovernance> | null | undefined, legacyPolicy?: Partial<TeamGovernance> | null | undefined): TeamGovernance;
export declare function teamEventLogPath(teamName: string, cwd: string): string;
export declare function writeAtomic(filePath: string, data: string): Promise<void>;
export declare function initTeamState(teamName: string, task: string, agentType: string, workerCount: number, cwd: string, maxWorkers?: number, env?: NodeJS.ProcessEnv, workspace?: TeamWorkspaceMetadata, lifecycleProfile?: 'default'): Promise<TeamConfig>;
export declare function writeTeamManifestV2(manifest: TeamManifestV2, cwd: string): Promise<void>;
export declare function readTeamManifestV2(teamName: string, cwd: string): Promise<TeamManifestV2 | null>;
export declare function migrateV1ToV2(teamName: string, cwd: string): Promise<TeamManifestV2 | null>;
export declare function readTeamConfig(teamName: string, cwd: string): Promise<TeamConfig | null>;
export declare function writeWorkerIdentity(teamName: string, workerName: string, identity: WorkerInfo, cwd: string): Promise<void>;
export declare function readWorkerHeartbeat(teamName: string, workerName: string, cwd: string): Promise<WorkerHeartbeat | null>;
export declare function updateWorkerHeartbeat(teamName: string, workerName: string, heartbeat: WorkerHeartbeat, cwd: string): Promise<void>;
export declare function readWorkerStatus(teamName: string, workerName: string, cwd: string): Promise<WorkerStatus>;
export declare function writeWorkerStatus(teamName: string, workerName: string, status: WorkerStatus, cwd: string): Promise<void>;
export declare function withScalingLock<T>(teamName: string, cwd: string, fn: () => Promise<T>): Promise<T>;
export declare function writeWorkerInbox(teamName: string, workerName: string, prompt: string, cwd: string): Promise<void>;
export declare function createTask(teamName: string, task: Omit<TeamTask, 'id' | 'created_at'>, cwd: string): Promise<TeamTaskV2>;
export declare function readTask(teamName: string, taskId: string, cwd: string): Promise<TeamTask | null>;
export declare function updateTask(teamName: string, taskId: string, updates: Partial<TeamTask>, cwd: string): Promise<TeamTask | null>;
export declare function listTasks(teamName: string, cwd: string): Promise<TeamTask[]>;
export declare function computeTaskReadiness(teamName: string, taskId: string, cwd: string): Promise<TaskReadiness>;
export declare function claimTask(teamName: string, taskId: string, workerName: string, expectedVersion: number | null, cwd: string): Promise<ClaimTaskResult>;
export declare function transitionTaskStatus(teamName: string, taskId: string, from: TeamTask['status'], to: TeamTask['status'], claimToken: string, cwd: string, terminalData?: {
    result?: string;
    error?: string;
}): Promise<TransitionTaskResult>;
export declare function releaseTaskClaim(teamName: string, taskId: string, claimToken: string, workerName: string, cwd: string): Promise<ReleaseTaskClaimResult>;
export declare function reclaimExpiredTaskClaim(teamName: string, taskId: string, cwd: string): Promise<ReclaimTaskResult>;
export declare function appendTeamEvent(teamName: string, event: Omit<TeamEvent, 'event_id' | 'created_at' | 'team'>, cwd: string): Promise<TeamEvent>;
export declare function resolveDispatchLockTimeoutMs(env?: NodeJS.ProcessEnv): number;
export declare function enqueueDispatchRequest(teamName: string, requestInput: TeamDispatchRequestInput, cwd: string): Promise<{
    request: TeamDispatchRequest;
    deduped: boolean;
}>;
export declare function listDispatchRequests(teamName: string, cwd: string, opts?: {
    status?: TeamDispatchRequestStatus;
    kind?: TeamDispatchRequestKind;
    to_worker?: string;
    limit?: number;
}): Promise<TeamDispatchRequest[]>;
export declare function readDispatchRequest(teamName: string, requestId: string, cwd: string): Promise<TeamDispatchRequest | null>;
export declare function transitionDispatchRequest(teamName: string, requestId: string, from: TeamDispatchRequestStatus, to: TeamDispatchRequestStatus, patch: Partial<TeamDispatchRequest> | undefined, cwd: string): Promise<TeamDispatchRequest | null>;
export declare function markDispatchRequestNotified(teamName: string, requestId: string, patch: Partial<TeamDispatchRequest> | undefined, cwd: string): Promise<TeamDispatchRequest | null>;
export declare function markDispatchRequestDelivered(teamName: string, requestId: string, patch: Partial<TeamDispatchRequest> | undefined, cwd: string): Promise<TeamDispatchRequest | null>;
export declare function sendDirectMessage(teamName: string, fromWorker: string, toWorker: string, body: string, cwd: string): Promise<TeamMailboxMessage>;
export declare function broadcastMessage(teamName: string, fromWorker: string, body: string, cwd: string): Promise<TeamMailboxMessage[]>;
export declare function markMessageDelivered(teamName: string, workerName: string, messageId: string, cwd: string): Promise<boolean>;
export declare function markMessageNotified(teamName: string, workerName: string, messageId: string, cwd: string): Promise<boolean>;
export declare function listMailboxMessages(teamName: string, workerName: string, cwd: string): Promise<TeamMailboxMessage[]>;
export declare function writeTaskApproval(teamName: string, approval: TaskApprovalRecord, cwd: string): Promise<void>;
export declare function readTaskApproval(teamName: string, taskId: string, cwd: string): Promise<TaskApprovalRecord | null>;
export declare function getTeamSummary(teamName: string, cwd: string): Promise<TeamSummary | null>;
export interface ShutdownAck {
    status: 'accept' | 'reject';
    reason?: string;
    updated_at?: string;
}
export declare function writeShutdownRequest(teamName: string, workerName: string, requestedBy: string, cwd: string): Promise<void>;
export declare function readShutdownAck(teamName: string, workerName: string, cwd: string, minUpdatedAt?: string): Promise<ShutdownAck | null>;
export interface TeamWorkerIntegrationState {
    last_seen_head?: string;
    last_integrated_head?: string;
    last_leader_head?: string;
    last_rebased_leader_head?: string;
    status?: TeamWorkerIntegrationStatus;
    conflict_commit?: string;
    conflict_files?: string[];
    updated_at?: string;
}
export interface TeamMonitorSnapshotState {
    taskStatusById: Record<string, string>;
    workerAliveByName: Record<string, boolean>;
    workerStateByName: Record<string, string>;
    workerTurnCountByName: Record<string, number>;
    workerTaskIdByName: Record<string, string>;
    mailboxNotifiedByMessageId: Record<string, string>;
    /** Task IDs for which a task_completed event has already been emitted (from any path). */
    completedEventTaskIds: Record<string, boolean>;
    integrationByWorker?: Record<string, TeamWorkerIntegrationState>;
    /** Optional timing telemetry from the most recent monitorTeam poll. */
    monitorTimings?: {
        list_tasks_ms: number;
        worker_scan_ms: number;
        mailbox_delivery_ms: number;
        total_ms: number;
        updated_at: string;
    };
}
export interface TeamPhaseState {
    current_phase: TeamPhase | TerminalPhase;
    max_fix_attempts: number;
    current_fix_attempt: number;
    transitions: Array<{
        from: string;
        to: string;
        at: string;
        reason?: string;
    }>;
    updated_at: string;
}
export type TeamLeaderDecisionState = 'still_actionable' | 'done_waiting_on_leader' | 'stuck_waiting_on_leader';
export interface TeamLeaderAttentionState {
    team_name: string;
    updated_at: string;
    source: 'notify_hook' | 'native_stop' | 'native_session_end';
    leader_decision_state: TeamLeaderDecisionState;
    leader_attention_pending: boolean;
    leader_attention_reason: string | null;
    attention_reasons: string[];
    leader_stale: boolean;
    leader_session_active: boolean;
    leader_session_id: string | null;
    leader_session_stopped_at: string | null;
    unread_leader_message_count: number;
    work_remaining: boolean;
    stalled_for_ms: number | null;
}
export declare function readMonitorSnapshot(teamName: string, cwd: string): Promise<TeamMonitorSnapshotState | null>;
export declare function writeMonitorSnapshot(teamName: string, snapshot: TeamMonitorSnapshotState, cwd: string): Promise<void>;
export declare function readTeamPhase(teamName: string, cwd: string): Promise<TeamPhaseState | null>;
export declare function writeTeamPhase(teamName: string, phaseState: TeamPhaseState, cwd: string): Promise<void>;
export declare function readTeamLeaderAttention(teamName: string, cwd: string): Promise<TeamLeaderAttentionState | null>;
export declare function writeTeamLeaderAttention(teamName: string, attentionState: TeamLeaderAttentionState, cwd: string): Promise<void>;
export declare function markTeamLeaderSessionStopped(teamName: string, cwd: string, leaderSessionId: string, nowIso?: string): Promise<TeamLeaderAttentionState>;
export declare function markTeamLeaderStopObserved(teamName: string, cwd: string, leaderSessionId: string, nowIso?: string, source?: TeamLeaderAttentionState['source']): Promise<TeamLeaderAttentionState>;
export declare function markOwnedTeamsLeaderSessionStopped(cwd: string, leaderSessionId: string, nowIso?: string): Promise<string[]>;
export declare function markOwnedTeamsLeaderStopObserved(cwd: string, leaderSessionId: string, nowIso?: string, source?: TeamLeaderAttentionState['source']): Promise<string[]>;
export declare function saveTeamConfig(config: TeamConfig, cwd: string): Promise<void>;
export declare function cleanupTeamState(teamName: string, cwd: string): Promise<void>;
//# sourceMappingURL=state.d.ts.map