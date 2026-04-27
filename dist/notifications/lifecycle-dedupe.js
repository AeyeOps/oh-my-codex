import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const SESSION_ID_SAFE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/;
const LIFECYCLE_DEDUPE_FILE = 'lifecycle-notif-state.json';
const LIFECYCLE_DEDUPE_WINDOW_MS = 5_000;
const DEDUPED_EVENTS = new Set(['session-start', 'session-stop', 'session-end']);
function normalizeFingerprint(payload) {
    return JSON.stringify({
        event: payload.event,
        reason: payload.reason || '',
        activeMode: payload.activeMode || '',
        question: payload.question || '',
        incompleteTasks: payload.incompleteTasks || 0,
    });
}
function getStatePath(stateDir, sessionId) {
    if (SESSION_ID_SAFE_PATTERN.test(sessionId)) {
        return join(stateDir, 'sessions', sessionId, LIFECYCLE_DEDUPE_FILE);
    }
    return join(stateDir, LIFECYCLE_DEDUPE_FILE);
}
function readState(path) {
    try {
        if (!existsSync(path))
            return {};
        const parsed = JSON.parse(readFileSync(path, 'utf-8'));
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
function writeState(path, state) {
    try {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, JSON.stringify(state, null, 2));
    }
    catch {
        // best effort
    }
}
export function shouldDedupeLifecycleNotification(event) {
    return DEDUPED_EVENTS.has(event);
}
function stableSerialize(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }
    const entries = Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`);
    return `{${entries.join(',')}}`;
}
function shouldSendFingerprint(previous, fingerprint, nowMs) {
    if (!previous || previous.fingerprint !== fingerprint)
        return true;
    if (!previous.sentAt)
        return false;
    const previousMs = Date.parse(previous.sentAt);
    if (!Number.isFinite(previousMs))
        return false;
    return nowMs - previousMs >= LIFECYCLE_DEDUPE_WINDOW_MS;
}
function shouldSendScopedLifecycleBroadcast(stateDir, sessionId, bucket, eventKey, fingerprint, nowMs = Date.now()) {
    if (!sessionId || !stateDir)
        return true;
    const path = getStatePath(stateDir, sessionId);
    const state = readState(path);
    const bucketState = state[bucket] && typeof state[bucket] === 'object'
        ? state[bucket]
        : {};
    return shouldSendFingerprint(bucketState?.[eventKey], fingerprint, nowMs);
}
function recordScopedLifecycleBroadcastSent(stateDir, sessionId, bucket, eventKey, fingerprint, nowMs = Date.now()) {
    if (!sessionId || !stateDir)
        return;
    const path = getStatePath(stateDir, sessionId);
    const state = readState(path);
    const bucketState = state[bucket] && typeof state[bucket] === 'object'
        ? state[bucket]
        : {};
    bucketState[eventKey] = {
        fingerprint,
        sentAt: new Date(nowMs).toISOString(),
    };
    state[bucket] = bucketState;
    writeState(path, state);
}
export function createLifecycleBroadcastFingerprint(value) {
    return stableSerialize(value);
}
export function shouldSendLifecycleNotification(stateDir, payload, nowMs = Date.now()) {
    if (!shouldDedupeLifecycleNotification(payload.event))
        return true;
    return shouldSendScopedLifecycleBroadcast(stateDir, payload.sessionId, 'events', payload.event, normalizeFingerprint(payload), nowMs);
}
export function recordLifecycleNotificationSent(stateDir, payload, nowMs = Date.now()) {
    if (!shouldDedupeLifecycleNotification(payload.event))
        return;
    recordScopedLifecycleBroadcastSent(stateDir, payload.sessionId, 'events', payload.event, normalizeFingerprint(payload), nowMs);
}
export function shouldSendLifecycleHookBroadcast(stateDir, sessionId, eventKey, fingerprint, nowMs = Date.now()) {
    return shouldSendScopedLifecycleBroadcast(stateDir, sessionId, 'hookEvents', eventKey, fingerprint, nowMs);
}
export function recordLifecycleHookBroadcastSent(stateDir, sessionId, eventKey, fingerprint, nowMs = Date.now()) {
    recordScopedLifecycleBroadcastSent(stateDir, sessionId, 'hookEvents', eventKey, fingerprint, nowMs);
}
//# sourceMappingURL=lifecycle-dedupe.js.map