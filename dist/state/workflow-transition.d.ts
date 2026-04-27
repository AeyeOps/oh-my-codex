export declare const TRACKED_WORKFLOW_MODES: readonly ["autopilot", "autoresearch", "team", "ralph", "ultrawork", "ultraqa", "ralplan", "deep-interview"];
export type TrackedWorkflowMode = (typeof TRACKED_WORKFLOW_MODES)[number];
export type WorkflowTransitionAction = 'activate' | 'start' | 'write';
export type WorkflowTransitionKind = 'allow' | 'overlap' | 'auto-complete' | 'deny';
export declare function buildWorkflowTransitionMessage(sourceMode: TrackedWorkflowMode, requestedMode: TrackedWorkflowMode): string;
export interface WorkflowTransitionDecision {
    allowed: boolean;
    kind: WorkflowTransitionKind;
    currentModes: TrackedWorkflowMode[];
    requestedMode: TrackedWorkflowMode;
    resultingModes: TrackedWorkflowMode[];
    autoCompleteModes: TrackedWorkflowMode[];
    transitionMessage?: string;
    denialReason?: 'rollback';
}
export declare function isTrackedWorkflowMode(mode: string): mode is TrackedWorkflowMode;
export declare function evaluateWorkflowTransition(currentActiveModes: Iterable<string>, requestedMode: TrackedWorkflowMode): WorkflowTransitionDecision;
export declare function buildWorkflowTransitionError(currentActiveModes: Iterable<string>, requestedMode: TrackedWorkflowMode, action?: WorkflowTransitionAction): string;
export declare function assertWorkflowTransitionAllowed(currentActiveModes: Iterable<string>, requestedMode: TrackedWorkflowMode, action?: WorkflowTransitionAction): void;
export declare function readActiveWorkflowModes(cwd: string, sessionId?: string): Promise<TrackedWorkflowMode[]>;
export declare function pickPrimaryWorkflowMode(currentPrimary: unknown, resultingModes: readonly string[], fallbackMode: string): string;
//# sourceMappingURL=workflow-transition.d.ts.map