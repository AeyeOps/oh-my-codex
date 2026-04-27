/**
 * RALPLAN stage adapter for pipeline orchestrator.
 *
 * Wraps the consensus planning workflow (planner + architect + critic)
 * into a PipelineStage. Produces a plan artifact at `.omx/plans/`.
 */
import type { PipelineStage } from '../types.js';
import { type RalplanConsensusExecutor } from '../../ralplan/runtime.js';
export interface CreateRalplanStageOptions {
    executor?: RalplanConsensusExecutor;
    maxIterations?: number;
}
/**
 * Create a RALPLAN pipeline stage.
 *
 * The RALPLAN stage performs consensus planning by coordinating planner,
 * architect, and critic agents. It outputs a plan file that downstream
 * stages (team-exec) consume.
 *
 * By default this remains a structural adapter — actual agent orchestration
 * happens at the skill layer. When an executor is provided, the stage can
 * drive the real ralplan runtime and persist live mode state.
 */
export declare function createRalplanStage(options?: CreateRalplanStageOptions): PipelineStage;
//# sourceMappingURL=ralplan.d.ts.map