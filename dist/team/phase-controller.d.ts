import { type TeamPhase, type TerminalPhase } from './orchestrator.js';
import { type TeamPhaseState } from './state.js';
export declare function inferPhaseTargetFromTaskCounts(taskCounts: {
    pending: number;
    blocked: number;
    in_progress: number;
    failed: number;
}, options?: {
    verificationPending?: boolean;
}): TeamPhase | TerminalPhase;
export declare function reconcilePhaseStateForMonitor(persisted: TeamPhaseState | null, target: TeamPhase | TerminalPhase): TeamPhaseState;
//# sourceMappingURL=phase-controller.d.ts.map