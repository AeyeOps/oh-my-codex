type PostToolUseStatus = 'applied' | 'noop' | 'conflict' | 'skipped';
type PostToolUseOperationKind = 'auto_checkpoint' | 'worker_clean_rebase' | 'leader_integration_attempt';
type JsonRecord = Record<string, unknown>;
export interface TeamWorkerPostToolUseResult {
    handled: boolean;
    status: PostToolUseStatus;
    reason?: string;
    teamName?: string;
    workerName?: string;
    stateRoot?: string;
    worktreePath?: string;
    workerHeadBefore?: string | null;
    workerHeadAfter?: string | null;
    checkpointCommit?: string | null;
    leaderHeadObserved?: string | null;
    operationKinds: PostToolUseOperationKind[];
    dedupeKey?: string;
}
declare function parsePorcelainPaths(status: string): string[];
declare function isProtectedCheckpointPath(path: string): boolean;
declare function buildDedupeKey(params: {
    teamName: string;
    workerName: string;
    workerHeadAfter: string | null;
    operationKind: PostToolUseOperationKind;
}): string;
export declare function handleTeamWorkerPostToolUseSuccess(payload: JsonRecord, cwd: string, env?: NodeJS.ProcessEnv): Promise<TeamWorkerPostToolUseResult>;
export declare const teamWorkerPostToolUseInternals: {
    buildDedupeKey: typeof buildDedupeKey;
    isProtectedCheckpointPath: typeof isProtectedCheckpointPath;
    parsePorcelainPaths: typeof parsePorcelainPaths;
};
export {};
//# sourceMappingURL=team-worker-posttooluse.d.ts.map