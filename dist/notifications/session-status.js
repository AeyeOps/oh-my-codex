import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isSessionStateUsable, readUsableSessionState } from '../hooks/session.js';
import { getSkillActiveStatePaths, listActiveSkills, readSkillActiveState } from '../state/skill-active.js';
import { readRunState } from '../runtime/run-state.js';
import { readSubagentSessionSummary, } from '../subagents/tracker.js';
import { omxLogsDir } from '../utils/paths.js';
export const DISCORD_STATUS_COMMAND = 'status';
export const DISCORD_STATUS_STALE_AFTER_MS = 5 * 60_000;
export const DISCORD_STATUS_MAX_SUBAGENTS = 3;
export const NO_TRACKED_SESSION_MESSAGE = 'No tracked OMX session is associated with this message.';
export const STATUS_DATA_UNAVAILABLE_MESSAGE = 'Tracked OMX session found, but status data is unavailable.';
export function isDiscordStatusCommand(input) {
    return input.trim().toLowerCase() === DISCORD_STATUS_COMMAND;
}
function shortenIdentifier(identifier) {
    const trimmed = identifier.trim();
    if (trimmed.length <= 6)
        return trimmed;
    return trimmed.slice(0, 6);
}
function readLatestHistoryEntry(projectPath, sessionId, deps) {
    const existsSyncImpl = deps.existsSyncImpl ?? existsSync;
    const readFileSyncImpl = deps.readFileSyncImpl ?? readFileSync;
    const historyPath = join(omxLogsDir(projectPath), 'session-history.jsonl');
    if (!existsSyncImpl(historyPath))
        return null;
    try {
        const content = readFileSyncImpl(historyPath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim() !== '');
        for (let index = lines.length - 1; index >= 0; index -= 1) {
            try {
                const parsed = JSON.parse(lines[index]);
                if (parsed.session_id === sessionId) {
                    return parsed;
                }
            }
            catch {
                // Ignore malformed history lines.
            }
        }
    }
    catch {
        return null;
    }
    return null;
}
async function readRelevantSkillState(projectPath, sessionId, deps) {
    const existsSyncImpl = deps.existsSyncImpl ?? existsSync;
    const getSkillActiveStatePathsImpl = deps.getSkillActiveStatePathsImpl ?? getSkillActiveStatePaths;
    const readSkillActiveStateImpl = deps.readSkillActiveStateImpl ?? readSkillActiveState;
    const readRunStateImpl = deps.readRunStateImpl ?? readRunState;
    const { rootPath, sessionPath } = getSkillActiveStatePathsImpl(projectPath, sessionId);
    const candidatePaths = [sessionPath, rootPath].filter((value) => typeof value === 'string');
    for (const candidatePath of candidatePaths) {
        if (!existsSyncImpl(candidatePath))
            continue;
        const state = await readSkillActiveStateImpl(candidatePath);
        if (!state)
            continue;
        const stateSessionId = typeof state.session_id === 'string' ? state.session_id.trim() : '';
        const entries = listActiveSkills(state);
        const visibleEntries = entries.filter((entry) => {
            const entrySessionId = typeof entry.session_id === 'string' ? entry.session_id.trim() : '';
            return entrySessionId.length === 0 || entrySessionId === sessionId;
        });
        if (candidatePath === rootPath && ((stateSessionId && stateSessionId !== sessionId)
            || (entries.length > 0 && visibleEntries.length === 0))) {
            continue;
        }
        const primary = visibleEntries[0];
        const skill = primary?.skill || (typeof state.skill === 'string' ? state.skill.trim() : '');
        const phase = primary?.phase || (typeof state.phase === 'string' ? state.phase.trim() : '');
        const updatedAt = typeof state.updated_at === 'string' ? state.updated_at.trim() : '';
        const requiresDurableRuntime = candidatePath === sessionPath && skill.length > 0;
        const runState = requiresDurableRuntime ? await readRunStateImpl(projectPath, sessionId) : null;
        const hasDurableRuntime = !requiresDurableRuntime || (runState?.active === true
            && typeof runState.mode === 'string'
            && runState.mode.trim() === skill);
        return {
            ...(hasDurableRuntime && skill ? { skill } : {}),
            ...(hasDurableRuntime
                ? { phase: (runState?.current_phase?.trim() || phase || undefined) }
                : {}),
            ...(updatedAt ? { updatedAt } : {}),
        };
    }
    return null;
}
function selectLatestTimestamp(timestamps) {
    let latest;
    let latestMs = Number.NEGATIVE_INFINITY;
    for (const timestamp of timestamps) {
        if (!timestamp)
            continue;
        const parsed = Date.parse(timestamp);
        if (!Number.isFinite(parsed))
            continue;
        if (parsed > latestMs) {
            latest = timestamp;
            latestMs = parsed;
        }
    }
    return latest;
}
function formatFreshnessLabel(latestTimestamp, nowValue) {
    if (!latestTimestamp)
        return 'Freshness unknown';
    const nowMs = typeof nowValue === 'string'
        ? Date.parse(nowValue)
        : nowValue instanceof Date
            ? nowValue.getTime()
            : Date.now();
    const updatedMs = Date.parse(latestTimestamp);
    if (!Number.isFinite(nowMs) || !Number.isFinite(updatedMs)) {
        return 'Freshness unknown';
    }
    if (nowMs - updatedMs > DISCORD_STATUS_STALE_AFTER_MS) {
        return `May be stale (last updated ${latestTimestamp})`;
    }
    return 'Fresh';
}
function formatSubagentSummary(summary) {
    if (!summary)
        return 'unknown';
    const activeIds = summary.activeSubagentThreadIds;
    if (activeIds.length === 0) {
        return '0 active';
    }
    const visible = activeIds.slice(0, DISCORD_STATUS_MAX_SUBAGENTS).map(shortenIdentifier);
    const hiddenCount = activeIds.length - visible.length;
    if (hiddenCount > 0) {
        return `${activeIds.length} active (${visible.join(', ')}, +${hiddenCount} more)`;
    }
    return `${activeIds.length} active (${visible.join(', ')})`;
}
function formatStateLabel(isRunning, hasHistory, skillState) {
    const lifecycle = isRunning ? 'running' : hasHistory ? 'ended' : 'unknown';
    const mode = skillState?.skill
        ? skillState.phase ? `${skillState.skill}/${skillState.phase}` : skillState.skill
        : '';
    if (lifecycle === 'running' && mode) {
        return `${lifecycle} (${mode})`;
    }
    if (lifecycle === 'unknown' && mode) {
        return mode;
    }
    return lifecycle;
}
export async function buildDiscordSessionStatusReply(mapping, deps = {}) {
    if (!mapping.projectPath) {
        return STATUS_DATA_UNAVAILABLE_MESSAGE;
    }
    const readCurrentSessionState = async (projectPath) => {
        if (deps.readUsableSessionStateImpl) {
            return deps.readUsableSessionStateImpl(projectPath);
        }
        if (!deps.readSessionStateImpl) {
            return readUsableSessionState(projectPath);
        }
        const state = await deps.readSessionStateImpl(projectPath);
        if (!state)
            return null;
        return isSessionStateUsable(state, projectPath) ? state : null;
    };
    const readSubagentSessionSummaryImpl = deps.readSubagentSessionSummaryImpl ?? readSubagentSessionSummary;
    const currentSession = await readCurrentSessionState(mapping.projectPath);
    const currentSessionMatches = currentSession?.session_id === mapping.sessionId ? currentSession : null;
    const historyEntry = readLatestHistoryEntry(mapping.projectPath, mapping.sessionId, deps);
    const skillState = await readRelevantSkillState(mapping.projectPath, mapping.sessionId, deps);
    const subagentSummary = await readSubagentSessionSummaryImpl(mapping.projectPath, mapping.sessionId, {
        ...(deps.now ? { now: deps.now } : {}),
    });
    if (!currentSessionMatches && !historyEntry && !skillState && !subagentSummary) {
        return STATUS_DATA_UNAVAILABLE_MESSAGE;
    }
    const latestTimestamp = selectLatestTimestamp([
        skillState?.updatedAt,
        subagentSummary?.updatedAt,
        historyEntry?.ended_at,
    ]);
    const nativeSessionId = currentSessionMatches?.native_session_id
        || historyEntry?.native_session_id
        || 'unknown';
    const stateLabel = formatStateLabel(Boolean(currentSessionMatches), Boolean(historyEntry), skillState);
    const tmuxSessionName = mapping.tmuxSessionName?.trim() || 'unknown';
    const tmuxPaneId = mapping.tmuxPaneId?.trim() || 'unknown';
    const subagents = formatSubagentSummary(subagentSummary);
    const freshness = formatFreshnessLabel(latestTimestamp, deps.now);
    const lines = [
        'Tracked OMX session status',
        `Session: ${mapping.sessionId}`,
        `Native: ${nativeSessionId}`,
        `State: ${stateLabel}`,
        `Tmux: ${tmuxSessionName} / ${tmuxPaneId}`,
        ...(latestTimestamp ? [`Updated: ${latestTimestamp}`] : []),
        `Freshness: ${freshness}`,
        `Subagents: ${subagents}`,
    ];
    return lines.join('\n');
}
//# sourceMappingURL=session-status.js.map