/**
 * Team leader nudge: remind the leader to check teammate/mailbox state.
 */
export declare function resolveLeaderNudgeIntervalMs(): number;
export declare function resolveLeaderAllIdleNudgeCooldownMs(): number;
export declare function resolveLeaderStalenessThresholdMs(): number;
export declare function resolveFallbackProgressStallThresholdMs(): number;
export declare function resolveWorkerTurnStallThresholdMs(): number;
export declare function checkWorkerPanesAlive(tmuxTarget: any, workerPaneIds?: never[]): Promise<{
    alive: boolean;
    paneCount: number;
}>;
export declare function isLeaderStale(stateDir: any, thresholdMs: any, nowMs: any): Promise<boolean>;
export declare function emitTeamNudgeEvent(cwd: any, teamName: any, reason: any, orchestrationIntent: any, nowIso: any): Promise<void>;
export declare function maybeNudgeTeamLeader({ cwd, stateDir, logsDir, preComputedLeaderStale, allowFreshMailboxNudges, source, }: {
    cwd: any;
    stateDir: any;
    logsDir: any;
    preComputedLeaderStale: any;
    allowFreshMailboxNudges?: boolean | undefined;
    source?: string | undefined;
}): Promise<void>;
//# sourceMappingURL=team-leader-nudge.d.ts.map