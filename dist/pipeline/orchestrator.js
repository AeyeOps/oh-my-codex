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
import { startMode, readModeState, updateModeState, cancelMode } from '../modes/base.js';
const MODE_NAME = 'autopilot';
// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------
/**
 * Run a configured pipeline to completion.
 *
 * Executes stages sequentially, passing accumulated artifacts between them.
 * State is persisted after each stage transition via the ModeState system.
 */
export async function runPipeline(config) {
    validateConfig(config);
    const cwd = config.cwd ?? process.cwd();
    const maxRalphIterations = config.maxRalphIterations ?? 10;
    const workerCount = config.workerCount ?? 2;
    const agentType = config.agentType ?? 'executor';
    const startTime = Date.now();
    // Initialize pipeline mode state
    const modeState = await startMode(MODE_NAME, config.task, config.stages.length, cwd);
    const pipelineExtension = {
        pipeline_name: config.name,
        pipeline_stages: config.stages.map((s) => s.name),
        pipeline_stage_index: 0,
        pipeline_stage_results: {},
        pipeline_max_ralph_iterations: maxRalphIterations,
        pipeline_worker_count: workerCount,
        pipeline_agent_type: agentType,
    };
    await updateModeState(MODE_NAME, {
        ...modeState,
        ...pipelineExtension,
        current_phase: `stage:${config.stages[0].name}`,
    }, cwd);
    // Execute stages sequentially
    const stageResults = {};
    const artifacts = {};
    let previousResult;
    let lastStageName;
    for (let i = 0; i < config.stages.length; i++) {
        const stage = config.stages[i];
        // Build stage context
        const ctx = {
            task: config.task,
            artifacts: { ...artifacts },
            previousStageResult: previousResult,
            cwd,
            sessionId: config.sessionId,
        };
        // Fire transition callback from last completed/skipped stage to this one
        if (lastStageName && config.onStageTransition) {
            config.onStageTransition(lastStageName, stage.name);
        }
        // Check if stage should be skipped
        if (stage.canSkip?.(ctx)) {
            const skippedResult = {
                status: 'skipped',
                artifacts: {},
                duration_ms: 0,
            };
            stageResults[stage.name] = skippedResult;
            await updateModeState(MODE_NAME, {
                current_phase: `stage:${stage.name}:skipped`,
                pipeline_stage_index: i,
                pipeline_stage_results: { ...stageResults },
            }, cwd);
            lastStageName = stage.name;
            previousResult = skippedResult;
            continue;
        }
        // Update state to running
        await updateModeState(MODE_NAME, {
            current_phase: `stage:${stage.name}`,
            pipeline_stage_index: i,
            iteration: i + 1,
        }, cwd);
        // Execute the stage
        let result;
        try {
            result = await stage.run(ctx);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            result = {
                status: 'failed',
                artifacts: {},
                duration_ms: Date.now() - startTime,
                error: `Stage ${stage.name} threw: ${errorMsg}`,
            };
        }
        stageResults[stage.name] = result;
        // Merge artifacts
        if (result.artifacts) {
            Object.assign(artifacts, { [stage.name]: result.artifacts });
        }
        // Persist stage result
        await updateModeState(MODE_NAME, {
            current_phase: `stage:${stage.name}:${result.status}`,
            pipeline_stage_index: i,
            pipeline_stage_results: { ...stageResults },
        }, cwd);
        // Bail on failure
        if (result.status === 'failed') {
            const duration_ms = Date.now() - startTime;
            await updateModeState(MODE_NAME, {
                active: false,
                current_phase: 'failed',
                completed_at: new Date().toISOString(),
                error: result.error,
            }, cwd);
            return {
                status: 'failed',
                stageResults,
                duration_ms,
                artifacts,
                error: result.error,
                failedStage: stage.name,
            };
        }
        lastStageName = stage.name;
        previousResult = result;
    }
    // All stages completed
    const duration_ms = Date.now() - startTime;
    await updateModeState(MODE_NAME, {
        active: false,
        current_phase: 'complete',
        completed_at: new Date().toISOString(),
    }, cwd);
    return {
        status: 'completed',
        stageResults,
        duration_ms,
        artifacts,
    };
}
// ---------------------------------------------------------------------------
// Resume support
// ---------------------------------------------------------------------------
/**
 * Resume a pipeline from its last persisted state.
 *
 * Reads the pipeline ModeState and reconstructs a PipelineConfig starting
 * from the stage that was interrupted.
 */
export async function canResumePipeline(cwd) {
    const state = await readModeState(MODE_NAME, cwd);
    if (!state)
        return false;
    return state.active === true && state.current_phase !== 'complete' && state.current_phase !== 'failed';
}
/**
 * Read the current pipeline state extension fields.
 */
export async function readPipelineState(cwd) {
    const state = await readModeState(MODE_NAME, cwd);
    if (!state)
        return null;
    if (!state.pipeline_name)
        return null;
    return {
        pipeline_name: state.pipeline_name,
        pipeline_stages: state.pipeline_stages,
        pipeline_stage_index: state.pipeline_stage_index,
        pipeline_stage_results: state.pipeline_stage_results,
        pipeline_max_ralph_iterations: state.pipeline_max_ralph_iterations,
        pipeline_worker_count: state.pipeline_worker_count,
        pipeline_agent_type: state.pipeline_agent_type,
    };
}
/**
 * Cancel a running pipeline.
 */
export async function cancelPipeline(cwd) {
    await cancelMode(MODE_NAME, cwd);
}
// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateConfig(config) {
    if (!config.name || config.name.trim() === '') {
        throw new Error('Pipeline config requires a non-empty name');
    }
    if (!config.task || config.task.trim() === '') {
        throw new Error('Pipeline config requires a non-empty task');
    }
    if (!config.stages || config.stages.length === 0) {
        throw new Error('Pipeline config requires at least one stage');
    }
    // Ensure unique stage names
    const names = new Set();
    for (const stage of config.stages) {
        if (!stage.name || stage.name.trim() === '') {
            throw new Error('Every pipeline stage must have a non-empty name');
        }
        if (names.has(stage.name)) {
            throw new Error(`Duplicate stage name: ${stage.name}`);
        }
        names.add(stage.name);
    }
    if (config.maxRalphIterations != null) {
        if (!Number.isInteger(config.maxRalphIterations) || config.maxRalphIterations <= 0) {
            throw new Error('maxRalphIterations must be a positive integer');
        }
    }
    if (config.workerCount != null) {
        if (!Number.isInteger(config.workerCount) || config.workerCount <= 0) {
            throw new Error('workerCount must be a positive integer');
        }
    }
}
// ---------------------------------------------------------------------------
// Default autopilot pipeline factory
// ---------------------------------------------------------------------------
/**
 * Create the default autopilot pipeline configuration.
 *
 * Sequences: RALPLAN -> team-exec -> ralph-verify
 * This is the canonical OMX pipeline matching the OMC #1130 design.
 */
export function createAutopilotPipelineConfig(task, options) {
    return {
        name: 'autopilot',
        task,
        stages: options.stages,
        cwd: options.cwd,
        sessionId: options.sessionId,
        maxRalphIterations: options.maxRalphIterations ?? 10,
        workerCount: options.workerCount ?? 2,
        agentType: options.agentType ?? 'executor',
        onStageTransition: options.onStageTransition,
    };
}
//# sourceMappingURL=orchestrator.js.map