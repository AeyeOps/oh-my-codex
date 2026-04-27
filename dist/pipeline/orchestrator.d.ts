/**
 * Pipeline Orchestrator for oh-my-codex
 *
 * Sequences configurable stages (RALPLAN -> teams -> ralph verification)
 * and persists state through the ModeState system.
 *
 * Mirrors OMC #1130 pipeline design with OMX-specific adaptations:
 * - Execution backend is always teams (Codex CLI workers)
 * - Ralph iteration count is configurable
 * - Integrates with existing team mode infrastructure
 */
import type { PipelineConfig, PipelineResult, PipelineModeStateExtension } from './types.js';
/**
 * Run a configured pipeline to completion.
 *
 * Executes stages sequentially, passing accumulated artifacts between them.
 * State is persisted after each stage transition via the ModeState system.
 */
export declare function runPipeline(config: PipelineConfig): Promise<PipelineResult>;
/**
 * Resume a pipeline from its last persisted state.
 *
 * Reads the pipeline ModeState and reconstructs a PipelineConfig starting
 * from the stage that was interrupted.
 */
export declare function canResumePipeline(cwd?: string): Promise<boolean>;
/**
 * Read the current pipeline state extension fields.
 */
export declare function readPipelineState(cwd?: string): Promise<PipelineModeStateExtension | null>;
/**
 * Cancel a running pipeline.
 */
export declare function cancelPipeline(cwd?: string): Promise<void>;
/**
 * Create the default autopilot pipeline configuration.
 *
 * Sequences: RALPLAN -> team-exec -> ralph-verify
 * This is the canonical OMX pipeline matching the OMC #1130 design.
 */
export declare function createAutopilotPipelineConfig(task: string, options: {
    cwd?: string;
    sessionId?: string;
    maxRalphIterations?: number;
    workerCount?: number;
    agentType?: string;
    stages: PipelineConfig['stages'];
    onStageTransition?: PipelineConfig['onStageTransition'];
}): PipelineConfig;
//# sourceMappingURL=orchestrator.d.ts.map