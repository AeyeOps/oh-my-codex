/**
 * Resolve the canonical OMX team state root for a leader working directory.
 */
export declare function resolveCanonicalTeamStateRoot(leaderCwd: string, env?: NodeJS.ProcessEnv): string;
export interface TeamWorkerIdentityRef {
    teamName: string;
    workerName: string;
}
export type WorkerTeamStateRootSource = 'env' | 'leader_cwd' | 'cwd' | 'worker_directory' | 'identity_metadata' | 'manifest_metadata' | 'config_metadata';
export interface WorkerTeamStateRootResolution {
    ok: boolean;
    stateRoot: string | null;
    source: WorkerTeamStateRootSource | null;
    reason?: string;
    identityPath?: string;
    worktreePath?: string;
}
/**
 * Resolve the canonical team state root for an OMX team worker PostToolUse/git hook.
 *
 * This resolver is intentionally fail-closed: every successful source must have
 * a valid worker identity and, when present, whose worktree path matches the hook cwd/current
 * worktree. It prevents hooks running inside worker worktrees from guessing a
 * local `.omx/state` root and writing cross-worker runtime state in the wrong
 * place. The cwd fallback is retained only for this strict worker-worktree path.
 */
export declare function resolveWorkerTeamStateRoot(cwd: string, worker: TeamWorkerIdentityRef, env?: NodeJS.ProcessEnv): Promise<WorkerTeamStateRootResolution>;
/**
 * Resolve the team state root for non-git worker notify hooks.
 *
 * Notify hooks update heartbeat/idle/dispatch state and may run in contexts that
 * are not safe git operation contexts. They must still be worker-aware, but they
 * must not invent `cwd/.omx/state` when the runtime did not provide a canonical
 * root hint. Only explicit environment/leader metadata roots are considered, and
 * all successful roots still require a matching worker identity.
 */
export declare function resolveWorkerNotifyTeamStateRoot(cwd: string, worker: TeamWorkerIdentityRef, env?: NodeJS.ProcessEnv): Promise<WorkerTeamStateRootResolution>;
export declare function resolveWorkerTeamStateRootPath(cwd: string, worker: TeamWorkerIdentityRef, env?: NodeJS.ProcessEnv): Promise<string | null>;
export declare function resolveWorkerNotifyTeamStateRootPath(cwd: string, worker: TeamWorkerIdentityRef, env?: NodeJS.ProcessEnv): Promise<string | null>;
//# sourceMappingURL=state-root.d.ts.map