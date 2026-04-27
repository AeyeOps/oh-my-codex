export declare const PANE_READINESS_UNVERIFIED_REASON = "pane_readiness_unverified";
export declare function mapPaneInjectionReadinessReason(reason: any): any;
export declare function evaluatePaneInjectionReadiness(paneTarget: any, { skipIfScrolling, captureLines, requireRunningAgent, requireReady, requireIdle, requireObservableState, requireCaptureEvidence, }?: {
    skipIfScrolling?: boolean | undefined;
    captureLines?: number | undefined;
    requireRunningAgent?: boolean | undefined;
    requireReady?: boolean | undefined;
    requireIdle?: boolean | undefined;
    requireObservableState?: boolean | undefined;
    requireCaptureEvidence?: undefined;
}): Promise<any>;
export declare function sendPaneInput({ paneTarget, prompt, submitKeyPresses, submitDelayMs, typePrompt, }: any): Promise<any>;
export declare function checkPaneReadyForTeamSendKeys(paneTarget: any): Promise<any>;
//# sourceMappingURL=team-tmux-guard.d.ts.map