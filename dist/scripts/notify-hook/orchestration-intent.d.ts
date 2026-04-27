export declare const TEAM_ORCHESTRATION_INTENTS: readonly ["followup-reuse", "followup-relaunch", "stalled-unblock", "done-review-or-shutdown", "pending-mailbox-review"];
export declare const ORCHESTRATION_INTENT_TAG_PREFIX = "[OMX_INTENT:";
export declare function buildOrchestrationIntentTag(intent: any): string;
export declare function appendOrchestrationIntentTag(text: any, intent: any): string;
export declare function stripOrchestrationIntentTags(text: any): string;
export declare function classifyLeaderActionState({ allWorkersIdle, workerPanesAlive, taskCounts, teamProgressStalled, }?: {
    allWorkersIdle?: boolean | undefined;
    workerPanesAlive?: boolean | undefined;
    taskCounts?: {} | undefined;
    teamProgressStalled?: boolean | undefined;
}): "still_actionable" | "stuck_waiting_on_leader" | "done_waiting_on_leader";
export declare function resolveAllWorkersIdleIntent(leaderActionState?: string): "followup-reuse" | "stalled-unblock" | "done-review-or-shutdown";
export declare function resolveLeaderNudgeIntent({ nudgeReason, leaderActionState }?: {
    nudgeReason?: string | undefined;
    leaderActionState?: string | undefined;
}): "followup-reuse" | "followup-relaunch" | "stalled-unblock" | "done-review-or-shutdown" | "pending-mailbox-review";
export declare function resolveWorkerIdleIntent(currentState?: string): "followup-reuse" | "done-review-or-shutdown";
//# sourceMappingURL=orchestration-intent.d.ts.map