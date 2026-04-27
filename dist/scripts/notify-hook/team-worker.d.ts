/**
 * Team worker: heartbeat, idle detection, and leader notification.
 */
export declare function resolveTeamStateDirForWorker(cwd: any, parsedTeamWorker: any): Promise<string | null>;
export declare function parseTeamWorkerEnv(rawValue: any): {
    teamName: string;
    workerName: string;
} | null;
export declare function resolveWorkerIdleNotifyEnabled(): boolean;
export declare function resolveWorkerIdleCooldownMs(): number;
export declare function resolveAllWorkersIdleCooldownMs(): number;
export declare function resolveStatusStaleMs(): number;
export declare function resolveHeartbeatStaleMs(): number;
export declare function readWorkerStatusState(stateDir: any, teamName: any, workerName: any): Promise<any>;
export declare function readTeamWorkersForIdleCheck(stateDir: any, teamName: any): Promise<{
    workers: any[];
    tmuxSession: string;
    leaderPaneId: string;
} | null>;
export declare function updateWorkerHeartbeat(stateDir: any, teamName: any, workerName: any): Promise<void>;
export declare function maybeNotifyLeaderAllWorkersIdle({ cwd, stateDir, logsDir, parsedTeamWorker }: {
    cwd: any;
    stateDir: any;
    logsDir: any;
    parsedTeamWorker: any;
}): Promise<void>;
export declare function maybeNotifyLeaderWorkerIdle({ cwd, stateDir, logsDir, parsedTeamWorker }: {
    cwd: any;
    stateDir: any;
    logsDir: any;
    parsedTeamWorker: any;
}): Promise<void>;
//# sourceMappingURL=team-worker.d.ts.map