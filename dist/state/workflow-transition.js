import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { getReadScopedStatePaths } from '../mcp/state-paths.js';
export const TRACKED_WORKFLOW_MODES = [
    'autopilot',
    'autoresearch',
    'team',
    'ralph',
    'ultrawork',
    'ultraqa',
    'ralplan',
    'deep-interview',
];
const ALLOWED_OVERLAP_PAIRS = new Set([
    'ralph|team',
]);
const AUTO_COMPLETE_TRANSITIONS = new Set([
    'deep-interview->ralplan',
    'deep-interview->autoresearch',
    'ralplan->team',
    'ralplan->ralph',
    'ralplan->autopilot',
    'ralplan->autoresearch',
]);
const PLANNING_LIKE_MODES = new Set([
    'deep-interview',
    'ralplan',
]);
const EXECUTION_LIKE_MODES = new Set([
    'autopilot',
    'autoresearch',
    'team',
    'ralph',
    'ultrawork',
    'ultraqa',
]);
function safeString(value) {
    return typeof value === 'string' ? value : '';
}
function normalizeTrackedModes(modes) {
    const deduped = new Set();
    for (const mode of modes) {
        if (isTrackedWorkflowMode(mode)) {
            deduped.add(mode);
        }
    }
    return [...deduped];
}
function buildPairKey(a, b) {
    return [a, b].sort((left, right) => left.localeCompare(right)).join('|');
}
function isAllowedOverlap(a, b) {
    if (a === 'ultrawork' || b === 'ultrawork')
        return true;
    return ALLOWED_OVERLAP_PAIRS.has(buildPairKey(a, b));
}
function buildAutoCompleteKey(a, b) {
    return `${a}->${b}`;
}
function isAutoCompleteTransition(a, b) {
    return AUTO_COMPLETE_TRANSITIONS.has(buildAutoCompleteKey(a, b));
}
function isRollbackTransition(currentModes, requestedMode) {
    return PLANNING_LIKE_MODES.has(requestedMode)
        && currentModes.some((mode) => EXECUTION_LIKE_MODES.has(mode));
}
export function buildWorkflowTransitionMessage(sourceMode, requestedMode) {
    return `mode transiting: ${sourceMode} -> ${requestedMode}`;
}
function formatActiveModes(modes) {
    if (modes.length === 0)
        return 'no tracked workflows';
    if (modes.length === 1)
        return `${modes[0]} is already active`;
    if (modes.length === 2)
        return `${modes[0]} and ${modes[1]} are already active`;
    return `${modes.slice(0, -1).join(', ')}, and ${modes[modes.length - 1]} are already active`;
}
export function isTrackedWorkflowMode(mode) {
    return TRACKED_WORKFLOW_MODES.includes(mode);
}
export function evaluateWorkflowTransition(currentActiveModes, requestedMode) {
    const currentModes = normalizeTrackedModes(currentActiveModes);
    if (currentModes.includes(requestedMode)) {
        return {
            allowed: true,
            kind: 'allow',
            currentModes,
            requestedMode,
            resultingModes: currentModes,
            autoCompleteModes: [],
        };
    }
    if (currentModes.length === 0) {
        return {
            allowed: true,
            kind: 'allow',
            currentModes,
            requestedMode,
            resultingModes: [requestedMode],
            autoCompleteModes: [],
        };
    }
    const autoCompleteModes = currentModes.filter((mode) => isAutoCompleteTransition(mode, requestedMode));
    const survivableModes = currentModes.filter((mode) => !autoCompleteModes.includes(mode));
    if (autoCompleteModes.length > 0 && survivableModes.every((mode) => isAllowedOverlap(mode, requestedMode))) {
        return {
            allowed: true,
            kind: 'auto-complete',
            currentModes,
            requestedMode,
            resultingModes: normalizeTrackedModes([...survivableModes, requestedMode]),
            autoCompleteModes,
            transitionMessage: buildWorkflowTransitionMessage(autoCompleteModes[0], requestedMode),
        };
    }
    if (currentModes.every((mode) => isAllowedOverlap(mode, requestedMode))) {
        return {
            allowed: true,
            kind: 'overlap',
            currentModes,
            requestedMode,
            resultingModes: normalizeTrackedModes([...currentModes, requestedMode]),
            autoCompleteModes: [],
        };
    }
    return {
        allowed: false,
        kind: 'deny',
        currentModes,
        requestedMode,
        resultingModes: currentModes,
        autoCompleteModes: [],
        ...(isRollbackTransition(currentModes, requestedMode) ? { denialReason: 'rollback' } : {}),
    };
}
export function buildWorkflowTransitionError(currentActiveModes, requestedMode, action = 'activate') {
    const decision = evaluateWorkflowTransition(currentActiveModes, requestedMode);
    const activeModesMessage = formatActiveModes(decision.currentModes);
    const overlap = [...decision.currentModes, requestedMode].join(' + ');
    if (decision.denialReason === 'rollback') {
        return [
            `Cannot ${action} ${requestedMode}: ${activeModesMessage}.`,
            'Execution-to-planning rollback auto-complete is not allowed.',
            'First clear current state first and retry if this action is intended.',
            `Clear incompatible workflow state yourself via \`omx state clear --mode <mode>\` or the \`omx_state.*\` MCP tools, then retry.`,
        ].join(' ');
    }
    return [
        `Cannot ${action} ${requestedMode}: ${activeModesMessage}.`,
        `Unsupported workflow overlap: ${overlap}.`,
        'Current state is unchanged.',
        `Clear incompatible workflow state yourself via \`omx state clear --mode <mode>\` or the \`omx_state.*\` MCP tools, then retry.`,
    ].join(' ');
}
export function assertWorkflowTransitionAllowed(currentActiveModes, requestedMode, action = 'activate') {
    const decision = evaluateWorkflowTransition(currentActiveModes, requestedMode);
    if (decision.allowed)
        return;
    throw new Error(buildWorkflowTransitionError(currentActiveModes, requestedMode, action));
}
export async function readActiveWorkflowModes(cwd, sessionId) {
    const activeModes = [];
    for (const mode of TRACKED_WORKFLOW_MODES) {
        const candidatePaths = await getReadScopedStatePaths(mode, cwd, sessionId);
        for (const candidatePath of candidatePaths) {
            if (!existsSync(candidatePath))
                continue;
            try {
                const parsed = JSON.parse(await readFile(candidatePath, 'utf-8'));
                if (parsed.active === true) {
                    activeModes.push(mode);
                }
                break;
            }
            catch {
                throw new Error(`Cannot read ${mode} workflow state at ${candidatePath}. Repair or clear that workflow state yourself via \`omx state clear --mode ${mode}\` or the \`omx_state.*\` MCP tools.`);
            }
        }
    }
    return activeModes;
}
export function pickPrimaryWorkflowMode(currentPrimary, resultingModes, fallbackMode) {
    const normalizedCurrent = safeString(currentPrimary).trim();
    if (normalizedCurrent && resultingModes.includes(normalizedCurrent)) {
        return normalizedCurrent;
    }
    return resultingModes[0] || fallbackMode;
}
//# sourceMappingURL=workflow-transition.js.map