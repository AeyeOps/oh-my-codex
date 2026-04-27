declare function injectDispatchRequest(request: any, config: any, cwd: any, stateDir: any): Promise<{
    ok: boolean;
    reason: string;
    pane?: undefined;
    pane_source?: undefined;
    readiness_evidence?: undefined;
    pane_current_command?: undefined;
    tmux_injection_attempted?: undefined;
} | {
    ok: boolean;
    reason: any;
    pane: any;
    pane_source: any;
    readiness_evidence: any;
    pane_current_command: any;
    tmux_injection_attempted: boolean;
}>;
export declare function drainPendingTeamDispatch({ cwd, stateDir, logsDir, maxPerTick, injector, }?: {
    cwd?: string;
    stateDir?: string;
    logsDir?: string;
    maxPerTick?: number;
    injector?: typeof injectDispatchRequest;
}): Promise<{
    processed: number;
    skipped: number;
    failed: number;
    reason: string;
} | {
    processed: number;
    skipped: number;
    failed: number;
    reason?: undefined;
}>;
export {};
//# sourceMappingURL=team-dispatch.d.ts.map