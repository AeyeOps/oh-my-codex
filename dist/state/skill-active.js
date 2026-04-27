import { existsSync } from 'fs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { omxStateDir } from '../utils/paths.js';
import { assertWorkflowTransitionAllowed, isTrackedWorkflowMode, pickPrimaryWorkflowMode, } from './workflow-transition.js';
export const SKILL_ACTIVE_STATE_MODE = 'skill-active';
export const SKILL_ACTIVE_STATE_FILE = `${SKILL_ACTIVE_STATE_MODE}-state.json`;
export const CANONICAL_WORKFLOW_SKILLS = [
    'autopilot',
    'autoresearch',
    'team',
    'ralph',
    'ultrawork',
    'ultraqa',
    'ralplan',
    'deep-interview',
];
function safeString(value) {
    return typeof value === 'string' ? value : '';
}
function entryKey(entry) {
    return `${entry.skill}::${safeString(entry.session_id).trim()}`;
}
function filterRootEntriesForSession(entries, sessionId) {
    const normalizedSessionId = safeString(sessionId).trim();
    if (!normalizedSessionId)
        return entries;
    return entries.filter((entry) => {
        const entrySessionId = safeString(entry.session_id).trim();
        return entrySessionId.length === 0 || entrySessionId === normalizedSessionId;
    });
}
function filterSessionOnlyEntries(sessionState, rootEntries, sessionId) {
    const inheritedKeys = new Set(filterRootEntriesForSession(rootEntries, sessionId).map(entryKey));
    return listActiveSkills(sessionState ?? {}).filter((entry) => (safeString(entry.session_id).trim() === sessionId
        && !inheritedKeys.has(entryKey(entry))));
}
function normalizeSkillActiveEntry(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const skill = safeString(raw.skill).trim();
    if (!skill)
        return null;
    return {
        ...raw,
        skill,
        phase: safeString(raw.phase).trim() || undefined,
        active: raw.active !== false,
        activated_at: safeString(raw.activated_at).trim() || undefined,
        updated_at: safeString(raw.updated_at).trim() || undefined,
        session_id: safeString(raw.session_id).trim() || undefined,
        thread_id: safeString(raw.thread_id).trim() || undefined,
        turn_id: safeString(raw.turn_id).trim() || undefined,
    };
}
export function listActiveSkills(raw) {
    if (!raw || typeof raw !== 'object')
        return [];
    const state = raw;
    const deduped = new Map();
    if (Array.isArray(state.active_skills)) {
        for (const candidate of state.active_skills) {
            const normalized = normalizeSkillActiveEntry(candidate);
            if (!normalized || normalized.active === false)
                continue;
            deduped.set(normalized.skill, normalized);
        }
    }
    const topLevelSkill = safeString(state.skill).trim();
    if (deduped.size === 0 && state.active === true && topLevelSkill) {
        deduped.set(topLevelSkill, {
            skill: topLevelSkill,
            phase: safeString(state.phase).trim() || undefined,
            active: true,
            activated_at: safeString(state.activated_at).trim() || undefined,
            updated_at: safeString(state.updated_at).trim() || undefined,
            session_id: safeString(state.session_id).trim() || undefined,
            thread_id: safeString(state.thread_id).trim() || undefined,
            turn_id: safeString(state.turn_id).trim() || undefined,
        });
    }
    return [...deduped.values()];
}
export function normalizeSkillActiveState(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const state = raw;
    const activeSkills = listActiveSkills(state);
    const primary = activeSkills.find((entry) => entry.skill === safeString(state.skill).trim()) ?? activeSkills[0];
    const skill = safeString(state.skill).trim() || primary?.skill || '';
    if (!skill && activeSkills.length === 0)
        return null;
    return {
        ...state,
        version: typeof state.version === 'number' ? state.version : 1,
        active: typeof state.active === 'boolean' ? state.active : activeSkills.length > 0,
        skill,
        keyword: safeString(state.keyword).trim(),
        phase: safeString(state.phase).trim() || primary?.phase || '',
        activated_at: safeString(state.activated_at).trim() || primary?.activated_at || '',
        updated_at: safeString(state.updated_at).trim() || primary?.updated_at || '',
        source: safeString(state.source).trim() || undefined,
        session_id: safeString(state.session_id).trim() || primary?.session_id || undefined,
        thread_id: safeString(state.thread_id).trim() || primary?.thread_id || undefined,
        turn_id: safeString(state.turn_id).trim() || primary?.turn_id || undefined,
        active_skills: activeSkills.length > 0 ? activeSkills : undefined,
    };
}
export function getSkillActiveStatePaths(cwd, sessionId) {
    const rootPath = join(omxStateDir(cwd), SKILL_ACTIVE_STATE_FILE);
    const normalizedSession = safeString(sessionId).trim();
    if (!normalizedSession)
        return { rootPath };
    return {
        rootPath,
        sessionPath: join(omxStateDir(cwd), 'sessions', normalizedSession, SKILL_ACTIVE_STATE_FILE),
    };
}
export async function readSkillActiveState(path) {
    try {
        return normalizeSkillActiveState(JSON.parse(await readFile(path, 'utf-8')));
    }
    catch {
        return null;
    }
}
export async function writeSkillActiveStateCopies(cwd, state, sessionId, rootState) {
    const { rootPath, sessionPath } = getSkillActiveStatePaths(cwd, sessionId);
    const normalized = { version: 1, ...state };
    const normalizedRoot = rootState === null
        ? null
        : { version: 1, ...(rootState ?? normalized) };
    if (normalizedRoot !== null) {
        const rootPayload = JSON.stringify(normalizedRoot, null, 2);
        await mkdir(dirname(rootPath), { recursive: true });
        await writeFile(rootPath, rootPayload);
    }
    if (sessionPath) {
        const sessionPayload = JSON.stringify(normalized, null, 2);
        await mkdir(dirname(sessionPath), { recursive: true });
        await writeFile(sessionPath, sessionPayload);
    }
}
export async function readVisibleSkillActiveState(cwd, sessionId) {
    const { rootPath, sessionPath } = getSkillActiveStatePaths(cwd, sessionId);
    if (sessionPath && existsSync(sessionPath)) {
        return readSkillActiveState(sessionPath);
    }
    if (sessionPath)
        return null;
    if (!existsSync(rootPath))
        return null;
    return readSkillActiveState(rootPath);
}
export function tracksCanonicalWorkflowSkill(mode) {
    return CANONICAL_WORKFLOW_SKILLS.includes(mode);
}
export async function syncCanonicalSkillStateForMode(options) {
    const { cwd, mode, active, currentPhase, sessionId, threadId, turnId, nowIso = new Date().toISOString(), source = 'state-server', } = options;
    if (!tracksCanonicalWorkflowSkill(mode))
        return;
    const { rootPath, sessionPath } = getSkillActiveStatePaths(cwd, sessionId);
    const existingRoot = await readSkillActiveState(rootPath);
    const existingSession = sessionPath ? await readSkillActiveState(sessionPath) : null;
    if (!existingRoot && !existingSession && !active)
        return;
    const normalizedSessionId = safeString(sessionId).trim();
    const rootEntries = normalizedSessionId
        ? listActiveSkills(existingRoot ?? {}).filter((entry) => {
            const entrySessionId = safeString(entry.session_id).trim();
            return entrySessionId.length === 0 || entrySessionId === normalizedSessionId;
        })
        : listActiveSkills(existingRoot ?? {});
    const sessionOnlyEntries = normalizedSessionId
        ? listActiveSkills(existingSession ?? {}).filter((entry) => (safeString(entry.session_id).trim() === normalizedSessionId
            && !rootEntries.some((rootEntry) => (rootEntry.skill === entry.skill
                && safeString(rootEntry.session_id).trim() === safeString(entry.session_id).trim()))))
        : [];
    const visibleEntries = normalizedSessionId
        ? [...rootEntries, ...sessionOnlyEntries]
        : [...rootEntries];
    if (active && isTrackedWorkflowMode(mode)) {
        const currentWorkflowModes = visibleEntries
            .map((entry) => entry.skill)
            .filter(isTrackedWorkflowMode);
        assertWorkflowTransitionAllowed(currentWorkflowModes, mode, 'write');
    }
    const applyEntriesToState = (base, entries, fallbackMode) => {
        const currentPrimary = safeString(base?.skill).trim();
        const primarySkill = pickPrimaryWorkflowMode(currentPrimary, entries.map((entry) => entry.skill), fallbackMode);
        const primaryEntry = entries.find((entry) => entry.skill === primarySkill) ?? entries[0];
        return {
            ...(base ?? {}),
            version: 1,
            active: entries.length > 0,
            skill: primaryEntry?.skill || primarySkill || fallbackMode,
            keyword: safeString(base?.keyword).trim(),
            phase: primaryEntry?.phase || safeString(base?.phase).trim(),
            activated_at: primaryEntry?.activated_at || safeString(base?.activated_at).trim() || nowIso,
            updated_at: nowIso,
            source: safeString(base?.source).trim() || source,
            session_id: primaryEntry?.session_id || safeString(base?.session_id).trim() || undefined,
            thread_id: primaryEntry?.thread_id || safeString(base?.thread_id).trim() || undefined,
            turn_id: primaryEntry?.turn_id || safeString(base?.turn_id).trim() || undefined,
            active_skills: entries,
        };
    };
    if (normalizedSessionId) {
        const nextSessionEntries = sessionOnlyEntries.filter((entry) => entry.skill !== mode);
        if (active) {
            nextSessionEntries.push({
                skill: mode,
                phase: safeString(currentPhase).trim() || undefined,
                active: true,
                activated_at: sessionOnlyEntries.find((entry) => entry.skill === mode)?.activated_at || nowIso,
                updated_at: nowIso,
                session_id: normalizedSessionId,
                thread_id: safeString(threadId).trim() || undefined,
                turn_id: safeString(turnId).trim() || undefined,
            });
        }
        const nextRootEntries = rootEntries.filter((entry) => !(entry.skill === mode
            && safeString(entry.session_id).trim() === normalizedSessionId));
        const nextSessionState = applyEntriesToState(existingSession ?? existingRoot, [...nextRootEntries, ...nextSessionEntries], mode);
        const nextRootState = nextRootEntries.length > 0
            ? applyEntriesToState(existingRoot, nextRootEntries, mode)
            : applyEntriesToState(existingSession ?? existingRoot, active ? nextSessionEntries : [], mode);
        await writeSkillActiveStateCopies(cwd, nextSessionState, sessionId, nextRootState);
        return;
    }
    const nextRootEntries = rootEntries.filter((entry) => entry.skill !== mode);
    if (active) {
        nextRootEntries.push({
            skill: mode,
            phase: safeString(currentPhase).trim() || undefined,
            active: true,
            activated_at: rootEntries.find((entry) => entry.skill === mode)?.activated_at || nowIso,
            updated_at: nowIso,
            session_id: undefined,
            thread_id: safeString(threadId).trim() || undefined,
            turn_id: safeString(turnId).trim() || undefined,
        });
    }
    const nextRootState = applyEntriesToState(existingRoot, nextRootEntries, mode);
    await writeSkillActiveStateCopies(cwd, nextRootState, undefined, nextRootState);
    const sessionsDir = join(omxStateDir(cwd), 'sessions');
    if (!existsSync(sessionsDir))
        return;
    const sessionIds = await readdir(sessionsDir).catch(() => []);
    for (const candidate of sessionIds) {
        const sessionId = safeString(candidate).trim();
        if (!sessionId)
            continue;
        const sessionPath = join(sessionsDir, sessionId, SKILL_ACTIVE_STATE_FILE);
        if (!existsSync(sessionPath))
            continue;
        const existingSessionState = await readSkillActiveState(sessionPath);
        const sessionOnlyEntries = filterSessionOnlyEntries(existingSessionState, rootEntries, sessionId);
        const nextVisibleRootEntries = filterRootEntriesForSession(nextRootEntries, sessionId);
        const nextSessionEntries = [...nextVisibleRootEntries, ...sessionOnlyEntries];
        if (nextSessionEntries.length === 0) {
            await unlink(sessionPath).catch(() => { });
            continue;
        }
        const nextSessionState = applyEntriesToState(existingSessionState ?? existingRoot, nextSessionEntries, nextSessionEntries[0]?.skill || mode);
        await writeSkillActiveStateCopies(cwd, nextSessionState, sessionId, nextRootState);
    }
}
//# sourceMappingURL=skill-active.js.map