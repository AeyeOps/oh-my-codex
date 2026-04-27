/**
 * MCP-aligned gateway for all team operations.
 *
 * Both the MCP server (state-server.ts) and the runtime (runtime.ts)
 * import from this module instead of state.ts directly.
 * state.ts remains the private persistence layer.
 *
 * Every exported function here corresponds to (or backs) an MCP tool
 * with the same semantic name, ensuring the runtime contract matches
 * the external MCP surface.
 */
export type { TeamConfig, WorkerInfo, WorkerHeartbeat, WorkerStatus, TeamTask, TeamTaskV2, TeamTaskClaim, TeamManifestV2, TeamLeader, TeamPolicy, TeamGovernance, PermissionsSnapshot, TeamEvent, TeamMailboxMessage, TeamMailbox, TaskApprovalRecord, TeamDispatchRequest, TeamDispatchRequestInput, TeamDispatchRequestKind, TeamDispatchRequestStatus, TeamDispatchTransportPreference, TaskReadiness, ClaimTaskResult, TransitionTaskResult, ReleaseTaskClaimResult, ReclaimTaskResult, TeamSummary, ShutdownAck, TeamMonitorSnapshotState, TeamWorkerIntegrationState, TeamPhaseState, TeamLeaderDecisionState, TeamLeaderAttentionState, } from './state.js';
export { DEFAULT_MAX_WORKERS, ABSOLUTE_MAX_WORKERS } from './state.js';
export { initTeamState as teamInit } from './state.js';
export { readTeamConfig as teamReadConfig } from './state.js';
export { readTeamManifestV2 as teamReadManifest } from './state.js';
export { writeTeamManifestV2 as teamWriteManifest } from './state.js';
export { saveTeamConfig as teamSaveConfig } from './state.js';
export { cleanupTeamState as teamCleanup } from './state.js';
export { migrateV1ToV2 as teamMigrateV1ToV2 } from './state.js';
export { normalizeTeamPolicy as teamNormalizePolicy } from './state.js';
export { normalizeTeamGovernance as teamNormalizeGovernance } from './state.js';
export { writeWorkerIdentity as teamWriteWorkerIdentity } from './state.js';
export { readWorkerHeartbeat as teamReadWorkerHeartbeat } from './state.js';
export { updateWorkerHeartbeat as teamUpdateWorkerHeartbeat } from './state.js';
export { readWorkerStatus as teamReadWorkerStatus } from './state.js';
export { writeWorkerInbox as teamWriteWorkerInbox } from './state.js';
export { createTask as teamCreateTask } from './state.js';
export { readTask as teamReadTask } from './state.js';
export { listTasks as teamListTasks } from './state.js';
export { updateTask as teamUpdateTask } from './state.js';
export { claimTask as teamClaimTask } from './state.js';
export { releaseTaskClaim as teamReleaseTaskClaim } from './state.js';
export { reclaimExpiredTaskClaim as teamReclaimExpiredTaskClaim } from './state.js';
export { transitionTaskStatus as teamTransitionTaskStatus } from './state.js';
export { computeTaskReadiness as teamComputeTaskReadiness } from './state.js';
export { sendDirectMessage as teamSendMessage } from './state.js';
export { broadcastMessage as teamBroadcast } from './state.js';
export { listMailboxMessages as teamListMailbox } from './state.js';
export { markMessageDelivered as teamMarkMessageDelivered } from './state.js';
export { markMessageNotified as teamMarkMessageNotified } from './state.js';
export { enqueueDispatchRequest as teamEnqueueDispatchRequest } from './state.js';
export { listDispatchRequests as teamListDispatchRequests } from './state.js';
export { readDispatchRequest as teamReadDispatchRequest } from './state.js';
export { transitionDispatchRequest as teamTransitionDispatchRequest } from './state.js';
export { markDispatchRequestNotified as teamMarkDispatchRequestNotified } from './state.js';
export { markDispatchRequestDelivered as teamMarkDispatchRequestDelivered } from './state.js';
export { appendTeamEvent as teamAppendEvent } from './state.js';
export { readTaskApproval as teamReadTaskApproval } from './state.js';
export { writeTaskApproval as teamWriteTaskApproval } from './state.js';
export { getTeamSummary as teamGetSummary } from './state.js';
export { writeShutdownRequest as teamWriteShutdownRequest } from './state.js';
export { readShutdownAck as teamReadShutdownAck } from './state.js';
export { readMonitorSnapshot as teamReadMonitorSnapshot } from './state.js';
export { writeMonitorSnapshot as teamWriteMonitorSnapshot } from './state.js';
export { readTeamPhase as teamReadPhase } from './state.js';
export { writeTeamPhase as teamWritePhase } from './state.js';
export { readTeamLeaderAttention as teamReadLeaderAttention } from './state.js';
export { writeTeamLeaderAttention as teamWriteLeaderAttention } from './state.js';
export { markTeamLeaderSessionStopped as teamMarkLeaderSessionStopped } from './state.js';
export { markOwnedTeamsLeaderSessionStopped as teamMarkOwnedTeamsLeaderSessionStopped } from './state.js';
export { writeWorkerStatus as teamWriteWorkerStatus } from './state.js';
export { withScalingLock as teamWithScalingLock } from './state.js';
export { resolveDispatchLockTimeoutMs } from './state.js';
export { writeAtomic } from './state.js';
//# sourceMappingURL=team-ops.d.ts.map