import { type TrackedWorkflowMode, type WorkflowTransitionAction, type WorkflowTransitionDecision } from './workflow-transition.js';
export interface ReconciledWorkflowTransition {
    decision: WorkflowTransitionDecision;
    transitionMessage?: string;
    autoCompletedModes: TrackedWorkflowMode[];
    completedPaths: string[];
}
export declare function reconcileWorkflowTransition(cwd: string, requestedMode: TrackedWorkflowMode, options?: {
    action?: WorkflowTransitionAction;
    sessionId?: string;
    nowIso?: string;
    source?: string;
    currentModes?: Iterable<string>;
}): Promise<ReconciledWorkflowTransition>;
//# sourceMappingURL=workflow-transition-reconcile.d.ts.map