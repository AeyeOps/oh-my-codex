export const RALPH_PHASES = [
    'starting',
    'executing',
    'verifying',
    'fixing',
    'blocked_on_user',
    'complete',
    'failed',
    'cancelled',
];
const RALPH_PHASE_SET = new Set(RALPH_PHASES);
const RALPH_TERMINAL_PHASE_SET = new Set(['blocked_on_user', 'complete', 'failed', 'cancelled']);
const LEGACY_PHASE_ALIASES = {
    start: 'starting',
    started: 'starting',
    execution: 'executing',
    execute: 'executing',
    verify: 'verifying',
    verification: 'verifying',
    fix: 'fixing',
    blocked: 'blocked_on_user',
    'blocked-on-user': 'blocked_on_user',
    complete: 'complete',
    completed: 'complete',
    fail: 'failed',
    error: 'failed',
    cancel: 'cancelled',
};
function asFiniteNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return null;
    return value;
}
function isIsoTimestamp(value) {
    if (typeof value !== 'string' || value.trim() === '')
        return false;
    return Number.isFinite(Date.parse(value));
}
export function normalizeRalphPhase(rawPhase) {
    if (typeof rawPhase !== 'string' || rawPhase.trim() === '') {
        return { error: 'ralph.current_phase must be a non-empty string' };
    }
    const normalized = rawPhase.trim().toLowerCase();
    if (RALPH_PHASE_SET.has(normalized)) {
        return { phase: normalized };
    }
    const alias = LEGACY_PHASE_ALIASES[normalized];
    if (alias) {
        return {
            phase: alias,
            warning: `normalized legacy Ralph phase "${rawPhase}" -> "${alias}"`,
        };
    }
    return {
        error: `ralph.current_phase must be one of: ${RALPH_PHASES.join(', ')}`,
    };
}
export function validateAndNormalizeRalphState(candidate, options) {
    const nowIso = options?.nowIso ?? new Date().toISOString();
    const next = { ...candidate };
    let warning;
    if (next.current_phase != null) {
        const phase = normalizeRalphPhase(next.current_phase);
        if (phase.error)
            return { ok: false, error: phase.error };
        next.current_phase = phase.phase;
        if (phase.warning)
            warning = phase.warning;
    }
    if (next.active === true) {
        if (next.iteration == null)
            next.iteration = 0;
        if (next.max_iterations == null)
            next.max_iterations = 50;
        if (next.current_phase == null)
            next.current_phase = 'starting';
        if (next.started_at == null)
            next.started_at = nowIso;
    }
    if (next.iteration != null) {
        const value = asFiniteNumber(next.iteration);
        if (value === null || !Number.isInteger(value) || value < 0) {
            return { ok: false, error: 'ralph.iteration must be a finite integer >= 0' };
        }
    }
    if (next.max_iterations != null) {
        const value = asFiniteNumber(next.max_iterations);
        if (value === null || !Number.isInteger(value) || value <= 0) {
            return { ok: false, error: 'ralph.max_iterations must be a finite integer > 0' };
        }
    }
    if (typeof next.current_phase === 'string' && RALPH_TERMINAL_PHASE_SET.has(next.current_phase)) {
        if (next.active === true) {
            return { ok: false, error: 'terminal Ralph phases require active=false' };
        }
        if (next.completed_at == null) {
            next.completed_at = nowIso;
        }
    }
    if (next.started_at != null && !isIsoTimestamp(next.started_at)) {
        return { ok: false, error: 'ralph.started_at must be an ISO8601 timestamp' };
    }
    if (next.completed_at != null && !isIsoTimestamp(next.completed_at)) {
        return { ok: false, error: 'ralph.completed_at must be an ISO8601 timestamp' };
    }
    return { ok: true, state: next, warning };
}
//# sourceMappingURL=contract.js.map