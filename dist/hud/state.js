/**
 * OMX HUD - State file readers
 *
 * Reads .omx/state/ files to build HUD render context.
 */
import { readFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { omxStateDir } from '../utils/paths.js';
import { findGitLayout, readGitLayoutFile } from '../utils/git-layout.js';
import { getDefaultBridge, isBridgeEnabled } from '../runtime/bridge.js';
import { getReadScopedStateFilePaths, getReadScopedStatePaths, readCurrentSessionId } from '../mcp/state-paths.js';
import { teamReadPhase as readTeamPhase } from '../team/team-ops.js';
import { readUsableSessionState } from '../hooks/session.js';
import { listActiveSkills, readVisibleSkillActiveState } from '../state/skill-active.js';
import { DEFAULT_HUD_CONFIG } from './types.js';
async function readJsonFile(path) {
    try {
        const content = await readFile(path, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
async function readSessionAwareModeState(cwd, mode) {
    const candidates = await getReadScopedStatePaths(mode, cwd);
    const sessionId = await readCurrentSessionId(cwd);
    if (sessionId) {
        if (candidates.length === 0)
            return null;
        return readJsonFile(candidates[0]);
    }
    for (const candidate of candidates) {
        const state = await readJsonFile(candidate);
        if (state)
            return state;
    }
    return null;
}
function isValidPreset(value) {
    return value === 'minimal' || value === 'focused' || value === 'full';
}
function isValidGitDisplay(value) {
    return value === 'branch' || value === 'repo-branch';
}
function sanitizeOptionalString(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
export function normalizeHudConfig(raw) {
    const normalized = {
        preset: DEFAULT_HUD_CONFIG.preset,
        git: {
            ...DEFAULT_HUD_CONFIG.git,
        },
    };
    if (!raw || typeof raw !== 'object')
        return normalized;
    if (isValidPreset(raw.preset)) {
        normalized.preset = raw.preset;
    }
    if (raw.git && typeof raw.git === 'object') {
        if (isValidGitDisplay(raw.git.display)) {
            normalized.git.display = raw.git.display;
        }
        const remoteName = sanitizeOptionalString(raw.git.remoteName);
        if (remoteName)
            normalized.git.remoteName = remoteName;
        const repoLabel = sanitizeOptionalString(raw.git.repoLabel);
        if (repoLabel)
            normalized.git.repoLabel = repoLabel;
    }
    return normalized;
}
export async function readRalphState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'ralph');
    return state?.active ? state : null;
}
export async function readUltraworkState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'ultrawork');
    return state?.active ? state : null;
}
export async function readAutopilotState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'autopilot');
    return state?.active ? state : null;
}
export async function readRalplanState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'ralplan');
    return state?.active ? state : null;
}
export async function readDeepInterviewState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'deep-interview');
    if (!state?.active)
        return null;
    return {
        ...state,
        input_lock_active: state.input_lock_active ?? state.input_lock?.active === true,
    };
}
export async function readAutoresearchState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'autoresearch');
    return state?.active ? state : null;
}
export async function readUltraqaState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'ultraqa');
    return state?.active ? state : null;
}
export async function readTeamState(cwd) {
    const state = await readSessionAwareModeState(cwd, 'team');
    return state?.active ? state : null;
}
export async function readMetrics(cwd) {
    return readJsonFile(join(cwd, '.omx', 'metrics.json'));
}
export async function readHudNotifyState(cwd) {
    const [hudStatePath] = await getReadScopedStateFilePaths('hud-state.json', cwd, undefined, {
        rootFallback: false,
    });
    return readJsonFile(hudStatePath);
}
export async function readSessionState(cwd) {
    const state = await readUsableSessionState(cwd);
    return state?.session_id ? state : null;
}
export async function readHudConfig(cwd) {
    const config = await readJsonFile(join(cwd, '.omx', 'hud-config.json'));
    return normalizeHudConfig(config);
}
export function readVersion() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const pkgPath = join(dirname(__filename), '..', '..', 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return `v${pkg.version}`;
    }
    catch {
        return null;
    }
}
/**
 * On Windows, read common git queries directly from .git/ files to avoid
 * spawning console windows (conhost.exe flicker).  Falls back to execSync
 * for non-Windows platforms or unrecognised arguments.
 *
 * See: https://github.com/Yeachan-Heo/oh-my-codex/issues/1100
 */
function runGit(cwd, args) {
    if (process.platform === 'win32') {
        try {
            const gitLayout = findGitLayout(cwd);
            if (gitLayout) {
                const cmd = args.join(' ');
                if (cmd === 'rev-parse --abbrev-ref HEAD') {
                    const head = readGitLayoutFile(gitLayout.gitDir, 'HEAD');
                    if (head?.startsWith('ref: refs/heads/'))
                        return head.slice('ref: refs/heads/'.length);
                    return head; // detached HEAD — raw SHA
                }
                if (cmd.startsWith('remote get-url ')) {
                    const remoteName = args[2];
                    const config = readGitLayoutFile(gitLayout.gitDir, 'config')
                        ?? readGitLayoutFile(gitLayout.commonDir, 'config');
                    if (config) {
                        const escaped = remoteName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const re = new RegExp(`\\[remote "${escaped}"\\][\\s\\S]*?url\\s*=\\s*(.+)`, 'm');
                        const m = config.match(re);
                        if (m)
                            return m[1].trim();
                    }
                    return null;
                }
                if (cmd === 'remote') {
                    const config = readGitLayoutFile(gitLayout.gitDir, 'config')
                        ?? readGitLayoutFile(gitLayout.commonDir, 'config');
                    if (config) {
                        const matches = [...config.matchAll(/\[remote "([^"]+)"\]/g)];
                        if (matches.length > 0)
                            return matches.map((m) => m[1]).join('\n');
                    }
                    return null;
                }
                if (cmd === 'rev-parse --show-toplevel') {
                    return gitLayout.worktreeRoot;
                }
            }
        }
        catch { /* fall through to execSync */ }
    }
    return runGitExec(cwd, args);
}
function runGitExec(cwd, args) {
    try {
        return execFileSync('git', args, {
            cwd,
            encoding: 'utf-8',
            timeout: 2000,
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        }).trim() || null;
    }
    catch {
        return null;
    }
}
function extractRepoName(remoteUrl) {
    if (!remoteUrl)
        return null;
    const repoMatch = remoteUrl.match(/[:/]([^/]+?)(?:\.git)?$/);
    return repoMatch?.[1] ?? null;
}
function readGitBranchName(cwd, gitRunner) {
    return gitRunner(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
}
function readGitRemoteUrl(cwd, remoteName, gitRunner) {
    return gitRunner(cwd, ['remote', 'get-url', remoteName]);
}
function readFirstRemoteName(cwd, gitRunner) {
    const remotes = gitRunner(cwd, ['remote']);
    if (!remotes)
        return null;
    for (const remote of remotes.split(/\r?\n/)) {
        const trimmed = remote.trim();
        if (trimmed)
            return trimmed;
    }
    return null;
}
function readRepoBasename(cwd, gitRunner) {
    const topLevel = gitRunner(cwd, ['rev-parse', '--show-toplevel']);
    return topLevel ? basename(topLevel) : null;
}
function resolveRepoLabel(cwd, config, gitRunner) {
    if (config.git.repoLabel)
        return config.git.repoLabel;
    if (config.git.remoteName) {
        const repoFromConfiguredRemote = extractRepoName(readGitRemoteUrl(cwd, config.git.remoteName, gitRunner));
        if (repoFromConfiguredRemote)
            return repoFromConfiguredRemote;
    }
    const repoFromOrigin = extractRepoName(readGitRemoteUrl(cwd, 'origin', gitRunner));
    if (repoFromOrigin)
        return repoFromOrigin;
    const firstRemoteName = readFirstRemoteName(cwd, gitRunner);
    if (firstRemoteName) {
        const repoFromFirstRemote = extractRepoName(readGitRemoteUrl(cwd, firstRemoteName, gitRunner));
        if (repoFromFirstRemote)
            return repoFromFirstRemote;
    }
    return readRepoBasename(cwd, gitRunner);
}
export function readGitBranch(cwd) {
    return readGitBranchName(cwd, runGit);
}
export function buildGitBranchLabel(cwd, config = DEFAULT_HUD_CONFIG, gitRunner = runGit) {
    const branch = readGitBranchName(cwd, gitRunner);
    if (!branch)
        return null;
    if (config.git.display === 'branch') {
        return branch;
    }
    const repoLabel = resolveRepoLabel(cwd, config, gitRunner);
    return repoLabel ? `${repoLabel}/${branch}` : branch;
}
function canonicalPhaseForSkill(canonicalSkills, skill) {
    return canonicalSkills.get(skill)?.phase;
}
function mergePhase(detail, canonicalPhase) {
    if (detail?.active === true) {
        if (!canonicalPhase || detail.current_phase)
            return detail;
        return { ...detail, current_phase: canonicalPhase };
    }
    if (!canonicalPhase)
        return null;
    return { active: true, current_phase: canonicalPhase };
}
async function readCanonicalTeamPhase(cwd, teamDetail) {
    const teamName = sanitizeOptionalString(teamDetail?.team_name);
    if (!teamName)
        return undefined;
    const phaseState = await readTeamPhase(teamName, cwd).catch(() => null);
    return sanitizeOptionalString(phaseState?.current_phase);
}
function mergeTeamPhase(detail, canonicalSkillPhase, canonicalTeamPhase) {
    const canonicalPhase = canonicalTeamPhase || canonicalSkillPhase;
    if (detail?.active === true) {
        return canonicalPhase ? { ...detail, current_phase: canonicalPhase } : detail;
    }
    if (!canonicalPhase)
        return null;
    return { active: true, current_phase: canonicalPhase };
}
/** Read all state files and build the full render context */
export async function readAllState(cwd, config = DEFAULT_HUD_CONFIG) {
    const version = readVersion();
    const gitBranch = buildGitBranchLabel(cwd, config);
    const [metrics, hudNotify, session, currentSessionId] = await Promise.all([
        readMetrics(cwd),
        readHudNotifyState(cwd),
        readSessionState(cwd),
        readCurrentSessionId(cwd),
    ]);
    const canonicalSkillState = await readVisibleSkillActiveState(cwd, currentSessionId);
    const canonicalSkills = new Map(listActiveSkills(canonicalSkillState).map((entry) => [entry.skill, entry]));
    const useCompatibilityFallback = canonicalSkillState == null;
    const [ralphDetail, ultraworkDetail, autopilotDetail, ralplanDetail, deepInterviewDetail, autoresearchDetail, ultraqaDetail, teamDetail,] = await Promise.all([
        readSessionAwareModeState(cwd, 'ralph'),
        readSessionAwareModeState(cwd, 'ultrawork'),
        readSessionAwareModeState(cwd, 'autopilot'),
        readSessionAwareModeState(cwd, 'ralplan'),
        readSessionAwareModeState(cwd, 'deep-interview'),
        readSessionAwareModeState(cwd, 'autoresearch'),
        readSessionAwareModeState(cwd, 'ultraqa'),
        readSessionAwareModeState(cwd, 'team'),
    ]);
    const ralph = canonicalSkills.has('ralph') || useCompatibilityFallback
        ? (ralphDetail?.active === true ? mergePhase(ralphDetail, canonicalPhaseForSkill(canonicalSkills, 'ralph')) : null)
        : null;
    const ultrawork = canonicalSkills.has('ultrawork') || useCompatibilityFallback
        ? mergePhase(ultraworkDetail?.active === true ? ultraworkDetail : null, canonicalPhaseForSkill(canonicalSkills, 'ultrawork'))
        : null;
    const autopilot = canonicalSkills.has('autopilot') || useCompatibilityFallback
        ? mergePhase(autopilotDetail?.active === true ? autopilotDetail : null, canonicalPhaseForSkill(canonicalSkills, 'autopilot'))
        : null;
    const ralplan = canonicalSkills.has('ralplan') || useCompatibilityFallback
        ? mergePhase(ralplanDetail?.active === true ? ralplanDetail : null, canonicalPhaseForSkill(canonicalSkills, 'ralplan'))
        : null;
    const deepInterview = canonicalSkills.has('deep-interview') || useCompatibilityFallback
        ? (() => {
            const merged = mergePhase(deepInterviewDetail?.active === true ? {
                ...deepInterviewDetail,
                input_lock_active: deepInterviewDetail.input_lock_active ?? deepInterviewDetail.input_lock?.active === true,
            } : null, canonicalPhaseForSkill(canonicalSkills, 'deep-interview'));
            return merged;
        })()
        : null;
    const ultraqa = canonicalSkills.has('ultraqa') || useCompatibilityFallback
        ? mergePhase(ultraqaDetail?.active === true ? ultraqaDetail : null, canonicalPhaseForSkill(canonicalSkills, 'ultraqa'))
        : null;
    const canonicalTeamPhase = await readCanonicalTeamPhase(cwd, teamDetail?.active === true ? teamDetail : null);
    const team = canonicalSkills.has('team') || useCompatibilityFallback
        ? mergeTeamPhase(teamDetail?.active === true ? teamDetail : null, canonicalPhaseForSkill(canonicalSkills, 'team'), canonicalTeamPhase)
        : null;
    const autoresearch = canonicalSkills.has('autoresearch') || useCompatibilityFallback
        ? mergePhase(autoresearchDetail?.active === true ? autoresearchDetail : null, canonicalPhaseForSkill(canonicalSkills, 'autoresearch'))
        : null;
    // When the Rust runtime bridge is enabled, prefer Rust-authored snapshot
    // for authority/backlog/readiness display over JS-inferred state.
    let runtimeSnapshot = null;
    if (isBridgeEnabled()) {
        const stateDir = omxStateDir(cwd);
        const bridge = getDefaultBridge(stateDir);
        runtimeSnapshot = bridge.readCompatFile('snapshot.json');
    }
    return {
        version,
        gitBranch,
        ralph,
        ultrawork,
        autopilot,
        ralplan,
        deepInterview,
        autoresearch,
        ultraqa,
        team,
        metrics,
        hudNotify,
        session,
        runtimeSnapshot,
    };
}
//# sourceMappingURL=state.js.map