/**
 * Session Registry Module
 *
 * Maps platform message IDs to tmux pane IDs for reply correlation.
 * Uses JSONL append format for atomic writes with cross-process locking.
 *
 * Registry location: ~/.omx/state/reply-session-registry.jsonl (global, not worktree-local)
 * File permissions: 0600 (owner read/write only)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync, closeSync, writeSync, unlinkSync, statSync, constants, } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import { sleepSync } from '../utils/sleep.js';
const REGISTRY_PATH = join(homedir(), '.omx', 'state', 'reply-session-registry.jsonl');
const REGISTRY_LOCK_PATH = join(homedir(), '.omx', 'state', 'reply-session-registry.lock');
const SECURE_FILE_MODE = 0o600;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LOCK_TIMEOUT_MS = 2000;
const LOCK_WAIT_TIMEOUT_MS = 4000;
const LOCK_RETRY_MS = 20;
const LOCK_STALE_MS = 10000;
function ensureRegistryDir() {
    const registryDir = dirname(REGISTRY_PATH);
    if (!existsSync(registryDir)) {
        mkdirSync(registryDir, { recursive: true, mode: 0o700 });
    }
}
function sleepMs(ms) {
    sleepSync(ms);
}
function isPidAlive(pid) {
    if (!Number.isFinite(pid) || pid <= 0) {
        return false;
    }
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        const err = error;
        return err.code === 'EPERM';
    }
}
function readLockSnapshot() {
    try {
        const raw = readFileSync(REGISTRY_LOCK_PATH, 'utf-8');
        const trimmed = raw.trim();
        if (!trimmed) {
            return { raw, pid: null, token: null };
        }
        try {
            const parsed = JSON.parse(trimmed);
            const pid = typeof parsed.pid === 'number' && Number.isFinite(parsed.pid) ? parsed.pid : null;
            const token = typeof parsed.token === 'string' && parsed.token.length > 0 ? parsed.token : null;
            return { raw, pid, token };
        }
        catch {
            const [pidStr] = trimmed.split(':');
            const parsedPid = Number.parseInt(pidStr ?? '', 10);
            return {
                raw,
                pid: Number.isFinite(parsedPid) && parsedPid > 0 ? parsedPid : null,
                token: null,
            };
        }
    }
    catch {
        return null;
    }
}
function removeLockIfUnchanged(snapshot) {
    try {
        const currentRaw = readFileSync(REGISTRY_LOCK_PATH, 'utf-8');
        if (currentRaw !== snapshot.raw) {
            return false;
        }
    }
    catch {
        return false;
    }
    try {
        unlinkSync(REGISTRY_LOCK_PATH);
        return true;
    }
    catch {
        return false;
    }
}
function acquireRegistryLock() {
    ensureRegistryDir();
    const started = Date.now();
    while (Date.now() - started < LOCK_TIMEOUT_MS) {
        try {
            const token = randomUUID();
            const fd = openSync(REGISTRY_LOCK_PATH, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, SECURE_FILE_MODE);
            const lockPayload = JSON.stringify({
                pid: process.pid,
                acquiredAt: Date.now(),
                token,
            });
            writeSync(fd, lockPayload, null, 'utf-8');
            return { fd, token };
        }
        catch (error) {
            const err = error;
            if (err.code !== 'EEXIST') {
                throw error;
            }
            try {
                const lockAgeMs = Date.now() - statSync(REGISTRY_LOCK_PATH).mtimeMs;
                if (lockAgeMs > LOCK_STALE_MS) {
                    const snapshot = readLockSnapshot();
                    if (!snapshot) {
                        sleepMs(LOCK_RETRY_MS);
                        continue;
                    }
                    if (snapshot.pid !== null && isPidAlive(snapshot.pid)) {
                        sleepMs(LOCK_RETRY_MS);
                        continue;
                    }
                    if (removeLockIfUnchanged(snapshot)) {
                        continue;
                    }
                }
            }
            catch {
                // Lock may disappear between stat/unlink attempts
            }
            sleepMs(LOCK_RETRY_MS);
        }
    }
    return null;
}
function acquireRegistryLockOrWait(maxWaitMs = LOCK_WAIT_TIMEOUT_MS) {
    const started = Date.now();
    while (Date.now() - started < maxWaitMs) {
        const lock = acquireRegistryLock();
        if (lock !== null) {
            return lock;
        }
        if (Date.now() - started < maxWaitMs) {
            sleepMs(LOCK_RETRY_MS);
        }
    }
    return null;
}
function releaseRegistryLock(lock) {
    try {
        closeSync(lock.fd);
    }
    catch {
        // Ignore close errors
    }
    const snapshot = readLockSnapshot();
    if (!snapshot || snapshot.token !== lock.token) {
        return;
    }
    removeLockIfUnchanged(snapshot);
}
function withRegistryLockOrWait(onLocked, onLockUnavailable) {
    const lock = acquireRegistryLockOrWait();
    if (lock === null) {
        return onLockUnavailable();
    }
    try {
        return onLocked();
    }
    finally {
        releaseRegistryLock(lock);
    }
}
function withRegistryLock(onLocked, onLockUnavailable) {
    const lock = acquireRegistryLock();
    if (lock === null) {
        return onLockUnavailable();
    }
    try {
        return onLocked();
    }
    finally {
        releaseRegistryLock(lock);
    }
}
export function registerMessage(mapping) {
    return withRegistryLockOrWait(() => {
        ensureRegistryDir();
        const line = JSON.stringify(mapping) + '\n';
        const fd = openSync(REGISTRY_PATH, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT, SECURE_FILE_MODE);
        try {
            const buf = Buffer.from(line, 'utf-8');
            writeSync(fd, buf);
        }
        finally {
            closeSync(fd);
        }
        return true;
    }, () => {
        console.warn('[notifications] session registry lock unavailable; skipping reply correlation write');
        return false;
    });
}
export function loadAllMappings() {
    return withRegistryLockOrWait(() => readAllMappingsUnsafe(), () => []);
}
function readAllMappingsUnsafe() {
    if (!existsSync(REGISTRY_PATH)) {
        return [];
    }
    try {
        const content = readFileSync(REGISTRY_PATH, 'utf-8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
            try {
                return JSON.parse(line);
            }
            catch {
                return null;
            }
        })
            .filter((m) => m !== null);
    }
    catch {
        return [];
    }
}
export function lookupByMessageId(platform, messageId) {
    const mappings = loadAllMappings();
    for (let index = mappings.length - 1; index >= 0; index -= 1) {
        const mapping = mappings[index];
        if (mapping.platform === platform && mapping.messageId === messageId) {
            return mapping;
        }
    }
    return null;
}
export function removeSession(sessionId) {
    withRegistryLock(() => {
        const mappings = readAllMappingsUnsafe();
        const filtered = mappings.filter(m => m.sessionId !== sessionId);
        if (filtered.length === mappings.length) {
            return;
        }
        rewriteRegistryUnsafe(filtered);
    }, () => {
        // Best-effort cleanup
    });
}
export function removeMessagesByPane(paneId) {
    withRegistryLock(() => {
        const mappings = readAllMappingsUnsafe();
        const filtered = mappings.filter(m => m.tmuxPaneId !== paneId);
        if (filtered.length === mappings.length) {
            return;
        }
        rewriteRegistryUnsafe(filtered);
    }, () => {
        // Best-effort cleanup
    });
}
export function pruneStale() {
    withRegistryLock(() => {
        const now = Date.now();
        const mappings = readAllMappingsUnsafe();
        const filtered = mappings.filter(m => {
            try {
                const age = now - new Date(m.createdAt).getTime();
                return age < MAX_AGE_MS;
            }
            catch {
                return false;
            }
        });
        if (filtered.length === mappings.length) {
            return;
        }
        rewriteRegistryUnsafe(filtered);
    }, () => {
        // Best-effort cleanup
    });
}
function rewriteRegistryUnsafe(mappings) {
    ensureRegistryDir();
    if (mappings.length === 0) {
        writeFileSync(REGISTRY_PATH, '', { mode: SECURE_FILE_MODE });
        return;
    }
    const content = mappings.map(m => JSON.stringify(m)).join('\n') + '\n';
    writeFileSync(REGISTRY_PATH, content, { mode: SECURE_FILE_MODE });
}
//# sourceMappingURL=session-registry.js.map