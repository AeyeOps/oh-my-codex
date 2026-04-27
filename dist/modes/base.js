/**
 * Base mode lifecycle management for oh-my-codex
 * All execution modes (autopilot, autoresearch, deep-interview, ralph, ultrawork, team, ultraqa, ralplan) share this base.
 */
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { withModeRuntimeContext } from '../state/mode-state-context.js';
import { assertWorkflowTransitionAllowed, isTrackedWorkflowMode, readActiveWorkflowModes, } from '../state/workflow-transition.js';
import { reconcileWorkflowTransition } from '../state/workflow-transition-reconcile.js';
import { syncCanonicalSkillStateForMode } from '../state/skill-active.js';
import { validateAndNormalizeRalphState } from '../ralph/contract.js';
import { applyRunOutcomeContract } from '../runtime/run-outcome.js';
import { syncRunStateFromModeState } from '../runtime/run-state.js';
import { getBaseStateDir, getReadScopedStateDirs, getReadScopedStatePaths, getStatePath, resolveStateScope, } from '../mcp/state-paths.js';
const DEPRECATED_MODES = {
    ultrapilot: 'Use "team" instead. ultrapilot has been merged into team mode.',
    pipeline: 'Use "team" instead. pipeline has been merged into team mode.',
    ecomode: 'Use "ultrawork" instead. ecomode has been merged into ultrawork mode.',
};
/**
 * Check if a mode name is deprecated and return a warning message if so.
 * Returns null if the mode is not deprecated.
 */
export function getDeprecationWarning(mode) {
    const warning = DEPRECATED_MODES[mode];
    if (!warning)
        return null;
    return `[DEPRECATED] Mode "${mode}" is deprecated. ${warning}`;
}
function normalizeRalphModeStateOrThrow(state) {
    const originalPhase = state.current_phase;
    const validation = validateAndNormalizeRalphState(state);
    if (!validation.ok || !validation.state) {
        throw new Error(validation.error || 'Invalid ralph mode state');
    }
    const normalized = validation.state;
    if (typeof originalPhase === 'string'
        && typeof normalized.current_phase === 'string'
        && normalized.current_phase !== originalPhase) {
        normalized.ralph_phase_normalized_from = originalPhase;
    }
    return normalized;
}
function applySharedRunOutcomeContractOrThrow(state) {
    const validation = applyRunOutcomeContract(state);
    if (!validation.ok || !validation.state) {
        throw new Error(validation.error || 'Invalid run outcome state');
    }
    return validation.state;
}
function normalizeModeStateOrThrow(mode, state) {
    const normalized = mode === 'ralph'
        ? normalizeRalphModeStateOrThrow(state)
        : state;
    return applySharedRunOutcomeContractOrThrow(normalized);
}
function stateDir(projectRoot) {
    return getBaseStateDir(projectRoot);
}
export async function assertModeStartAllowed(mode, projectRoot) {
    if (!isTrackedWorkflowMode(mode))
        return;
    const scope = await resolveStateScope(projectRoot);
    const activeModes = await readActiveWorkflowModes(projectRoot ?? process.cwd(), scope.sessionId);
    assertWorkflowTransitionAllowed(activeModes, mode, 'start');
}
/**
 * Start a mode. Checks for exclusive mode conflicts.
 */
export async function startMode(mode, taskDescription, maxIterations = 50, projectRoot) {
    const dir = stateDir(projectRoot);
    await mkdir(dir, { recursive: true });
    const scope = await resolveStateScope(projectRoot);
    let transitionMessage;
    if (isTrackedWorkflowMode(mode)) {
        const transition = await reconcileWorkflowTransition(projectRoot ?? process.cwd(), mode, {
            action: 'start',
            sessionId: scope.sessionId,
            source: 'startMode',
        });
        transitionMessage = transition.transitionMessage;
    }
    await mkdir(scope.stateDir, { recursive: true });
    const stateBase = {
        active: true,
        mode,
        iteration: 0,
        max_iterations: maxIterations,
        current_phase: 'starting',
        task_description: taskDescription,
        started_at: new Date().toISOString(),
        ...(transitionMessage ? { transition_message: transitionMessage } : {}),
        ...(mode === 'ralph' && scope.sessionId ? { owner_omx_session_id: scope.sessionId } : {}),
    };
    const withContext = withModeRuntimeContext({}, stateBase);
    const state = normalizeModeStateOrThrow(mode, withContext);
    await writeFile(getStatePath(mode, projectRoot, scope.sessionId), JSON.stringify(state, null, 2));
    await syncRunStateFromModeState(state, projectRoot, scope.sessionId);
    if (isTrackedWorkflowMode(mode)) {
        await syncCanonicalSkillStateForMode({
            cwd: projectRoot ?? process.cwd(),
            mode,
            active: true,
            currentPhase: typeof state.current_phase === 'string' ? state.current_phase : undefined,
            sessionId: scope.sessionId,
            source: 'startMode',
        });
    }
    return state;
}
/**
 * Read current mode state
 */
export async function readModeState(mode, projectRoot) {
    const paths = await getReadScopedStatePaths(mode, projectRoot);
    return readModeStateFromPaths(paths);
}
async function readModeStateFromPaths(paths) {
    for (const path of paths) {
        if (!existsSync(path))
            continue;
        try {
            return JSON.parse(await readFile(path, 'utf-8'));
        }
        catch {
            return null;
        }
    }
    return null;
}
export async function readModeStateForSession(mode, sessionId, projectRoot) {
    let paths;
    try {
        paths = await getReadScopedStatePaths(mode, projectRoot, sessionId);
    }
    catch {
        return null;
    }
    return readModeStateFromPaths(paths);
}
/**
 * Update mode state (merge fields)
 */
export async function updateModeState(mode, updates, projectRoot, explicitSessionId) {
    const current = explicitSessionId
        ? await readModeStateForSession(mode, explicitSessionId, projectRoot)
        : await readModeState(mode, projectRoot);
    if (!current)
        throw new Error(`Mode ${mode} not found`);
    const scope = await resolveStateScope(projectRoot, explicitSessionId);
    await mkdir(scope.stateDir, { recursive: true });
    const updatedBase = { ...current, ...updates };
    if (!Object.prototype.hasOwnProperty.call(updates, 'run_outcome')) {
        delete updatedBase.run_outcome;
    }
    if (mode === 'ralph' && scope.sessionId && typeof updatedBase.owner_omx_session_id !== 'string') {
        updatedBase.owner_omx_session_id = scope.sessionId;
    }
    const normalizedBase = normalizeModeStateOrThrow(mode, updatedBase);
    const updated = withModeRuntimeContext(current, normalizedBase);
    await writeFile(getStatePath(mode, projectRoot, scope.sessionId), JSON.stringify(updated, null, 2));
    await syncRunStateFromModeState(updated, projectRoot, scope.sessionId);
    if (isTrackedWorkflowMode(mode)) {
        await syncCanonicalSkillStateForMode({
            cwd: projectRoot ?? process.cwd(),
            mode,
            active: updated.active === true,
            currentPhase: typeof updated.current_phase === 'string' ? updated.current_phase : undefined,
            sessionId: scope.sessionId,
            source: 'updateModeState',
        });
    }
    return updated;
}
/**
 * Cancel a mode
 */
export async function cancelMode(mode, projectRoot) {
    const state = await readModeState(mode, projectRoot);
    if (state && state.active) {
        await updateModeState(mode, {
            active: false,
            current_phase: 'cancelled',
            completed_at: new Date().toISOString(),
        }, projectRoot);
    }
}
/**
 * Cancel all active modes
 */
export async function cancelAllModes(projectRoot) {
    const dirs = await getReadScopedStateDirs(projectRoot);
    const cancelled = [];
    const seenModes = new Set();
    for (const dir of dirs) {
        if (!existsSync(dir))
            continue;
        const files = await readdir(dir);
        for (const f of files) {
            if (!f.endsWith('-state.json'))
                continue;
            const mode = f.replace('-state.json', '');
            if (seenModes.has(mode))
                continue;
            seenModes.add(mode);
            const state = await readModeState(mode, projectRoot);
            if (state?.active) {
                await cancelMode(mode, projectRoot);
                cancelled.push(mode);
            }
        }
    }
    return cancelled;
}
/**
 * List all active modes
 */
export async function listActiveModes(projectRoot) {
    const dirs = await getReadScopedStateDirs(projectRoot);
    const active = [];
    const seenModes = new Set();
    for (const dir of dirs) {
        if (!existsSync(dir))
            continue;
        const files = await readdir(dir);
        for (const f of files) {
            if (!f.endsWith('-state.json'))
                continue;
            const mode = f.replace('-state.json', '');
            if (seenModes.has(mode))
                continue;
            seenModes.add(mode);
            const state = await readModeState(mode, projectRoot);
            if (state?.active) {
                active.push({ mode, state });
            }
        }
    }
    return active;
}
//# sourceMappingURL=base.js.map