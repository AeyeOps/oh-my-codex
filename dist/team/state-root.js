import { existsSync } from 'fs';
import { readFile, realpath, stat } from 'fs/promises';
import { join, relative, resolve, sep } from 'path';
import { omxStateDir } from '../utils/paths.js';
/**
 * Resolve the canonical OMX team state root for a leader working directory.
 */
export function resolveCanonicalTeamStateRoot(leaderCwd, env = process.env) {
    const explicit = env.OMX_TEAM_STATE_ROOT;
    if (typeof explicit === 'string' && explicit.trim() !== '') {
        return resolve(leaderCwd, explicit.trim());
    }
    return resolve(omxStateDir(leaderCwd));
}
async function readJsonIfExists(path) {
    try {
        if (!existsSync(path))
            return null;
        const parsed = JSON.parse(await readFile(path, 'utf-8'));
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
}
function metadataStateRoot(value) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}
async function normalizePath(path) {
    const resolved = resolve(path);
    try {
        return await realpath(resolved);
    }
    catch {
        return resolved;
    }
}
function pathIsSameOrInside(candidate, parent) {
    if (candidate === parent)
        return true;
    const rel = relative(parent, candidate);
    return rel !== '' && !rel.startsWith('..') && rel !== '..' && !rel.startsWith(`..${sep}`);
}
async function cwdMatchesIdentityWorktree(cwd, identity) {
    const worktreePath = metadataStateRoot(identity.worktree_path);
    if (!worktreePath)
        return { matches: true };
    const [normalizedCwd, normalizedWorktree] = await Promise.all([
        normalizePath(cwd),
        normalizePath(worktreePath),
    ]);
    return pathIsSameOrInside(normalizedCwd, normalizedWorktree)
        ? { matches: true, worktreePath: normalizedWorktree }
        : { matches: false, worktreePath: normalizedWorktree };
}
async function validateWorkerStateRoot(stateRoot, cwd, worker) {
    const resolvedStateRoot = resolve(cwd, stateRoot);
    const identityPath = join(resolvedStateRoot, 'team', worker.teamName, 'workers', worker.workerName, 'identity.json');
    const identity = await readJsonIfExists(identityPath);
    if (!identity) {
        return {
            ok: false,
            stateRoot: null,
            source: null,
            reason: 'missing_or_invalid_identity',
            identityPath,
        };
    }
    const identityName = metadataStateRoot(identity.name);
    if (identityName && identityName !== worker.workerName) {
        return {
            ok: false,
            stateRoot: null,
            source: null,
            reason: 'identity_worker_mismatch',
            identityPath,
        };
    }
    const worktreeMatch = await cwdMatchesIdentityWorktree(cwd, identity);
    if (!worktreeMatch.matches) {
        return {
            ok: false,
            stateRoot: null,
            source: null,
            reason: 'identity_worktree_mismatch',
            identityPath,
            worktreePath: worktreeMatch.worktreePath,
        };
    }
    return {
        ok: true,
        stateRoot: resolvedStateRoot,
        source: null,
        identityPath,
        worktreePath: worktreeMatch.worktreePath,
    };
}
async function validateWithSource(stateRoot, source, cwd, worker) {
    const validated = await validateWorkerStateRoot(stateRoot, cwd, worker);
    return validated.ok ? { ...validated, source } : validated;
}
async function readMetadataRootFromValidatedCandidate(candidateStateRoot, filename, cwd, worker) {
    const validated = await validateWorkerStateRoot(candidateStateRoot, cwd, worker);
    if (!validated.ok)
        return null;
    const metadataPath = filename === 'identity.json'
        ? join(candidateStateRoot, 'team', worker.teamName, 'workers', worker.workerName, filename)
        : join(candidateStateRoot, 'team', worker.teamName, filename);
    const parsed = await readJsonIfExists(metadataPath);
    return metadataStateRoot(parsed?.team_state_root);
}
async function pathIsDirectory(path) {
    try {
        return (await stat(path)).isDirectory();
    }
    catch {
        return false;
    }
}
function workerListContains(parsed, workerName) {
    const workers = parsed?.workers;
    return Array.isArray(workers)
        && workers.some((worker) => worker && typeof worker === 'object' && !Array.isArray(worker)
            && metadataStateRoot(worker.name) === workerName);
}
function metadataTeamMatches(parsed, teamName) {
    const name = metadataStateRoot(parsed?.name);
    return !name || name === teamName;
}
async function readTeamMetadataRootFromCandidate(candidateStateRoot, filename, cwd, worker) {
    const resolvedStateRoot = resolve(cwd, candidateStateRoot);
    const parsed = await readJsonIfExists(join(resolvedStateRoot, 'team', worker.teamName, filename));
    if (!metadataTeamMatches(parsed, worker.teamName) || !workerListContains(parsed, worker.workerName))
        return null;
    return metadataStateRoot(parsed?.team_state_root);
}
async function validateWorkerNotifyStateRoot(stateRoot, source, cwd, worker) {
    const identityResolved = await validateWithSource(stateRoot, source, cwd, worker);
    if (identityResolved.ok)
        return identityResolved;
    const resolvedStateRoot = resolve(cwd, stateRoot);
    const teamRoot = join(resolvedStateRoot, 'team', worker.teamName);
    const workerDir = join(teamRoot, 'workers', worker.workerName);
    if (await pathIsDirectory(workerDir)) {
        return {
            ok: true,
            stateRoot: resolvedStateRoot,
            source: 'worker_directory',
            identityPath: join(workerDir, 'identity.json'),
        };
    }
    for (const [filename, metadataSource] of [
        ['manifest.v2.json', 'manifest_metadata'],
        ['config.json', 'config_metadata'],
    ]) {
        const parsed = await readJsonIfExists(join(teamRoot, filename));
        if (!metadataTeamMatches(parsed, worker.teamName) || !workerListContains(parsed, worker.workerName))
            continue;
        return {
            ok: true,
            stateRoot: resolvedStateRoot,
            source: metadataSource,
            identityPath: join(workerDir, 'identity.json'),
        };
    }
    return {
        ok: false,
        stateRoot: null,
        source: null,
        reason: identityResolved.reason || 'missing_worker_marker',
        identityPath: identityResolved.identityPath,
    };
}
async function resolveWorkerTeamStateRootWithOptions(cwd, worker, env, options) {
    const explicit = typeof env.OMX_TEAM_STATE_ROOT === 'string' ? env.OMX_TEAM_STATE_ROOT.trim() : '';
    if (explicit) {
        const resolved = await validateWithSource(resolve(cwd, explicit), 'env', cwd, worker);
        if (resolved.ok)
            return resolved;
        return { ...resolved, source: 'env' };
    }
    const leaderCwd = typeof env.OMX_TEAM_LEADER_CWD === 'string' ? env.OMX_TEAM_LEADER_CWD.trim() : '';
    const leaderStateRoot = leaderCwd ? join(resolve(cwd, leaderCwd), '.omx', 'state') : '';
    const cwdStateRoot = join(cwd, '.omx', 'state');
    const hintedCandidates = [
        ...(leaderStateRoot ? [{ stateRoot: leaderStateRoot, source: 'leader_cwd' }] : []),
        ...(options.allowCwdFallback ? [{ stateRoot: cwdStateRoot, source: 'cwd' }] : []),
    ];
    const metadataSources = [
        ['identity.json', 'identity_metadata'],
        ['manifest.v2.json', 'manifest_metadata'],
        ['config.json', 'config_metadata'],
    ];
    for (const candidate of hintedCandidates) {
        const direct = await validateWithSource(candidate.stateRoot, candidate.source, cwd, worker);
        if (!direct.ok)
            continue;
        if (options.preferMetadataRoot) {
            for (const [filename, source] of metadataSources) {
                const metadataRoot = await readMetadataRootFromValidatedCandidate(candidate.stateRoot, filename, cwd, worker);
                if (!metadataRoot)
                    continue;
                const resolved = await validateWithSource(resolve(cwd, metadataRoot), source, cwd, worker);
                if (resolved.ok)
                    return resolved;
            }
        }
        return direct;
    }
    const diagnosticStateRoot = leaderStateRoot || (options.allowCwdFallback ? cwdStateRoot : '');
    const diagnostic = diagnosticStateRoot
        ? await validateWithSource(diagnosticStateRoot, leaderStateRoot ? 'leader_cwd' : 'cwd', cwd, worker)
        : null;
    return {
        ok: false,
        stateRoot: null,
        source: null,
        reason: diagnostic?.reason || 'no_valid_worker_state_root',
        identityPath: diagnostic?.identityPath,
    };
}
/**
 * Resolve the canonical team state root for an OMX team worker PostToolUse/git hook.
 *
 * This resolver is intentionally fail-closed: every successful source must have
 * a valid worker identity and, when present, whose worktree path matches the hook cwd/current
 * worktree. It prevents hooks running inside worker worktrees from guessing a
 * local `.omx/state` root and writing cross-worker runtime state in the wrong
 * place. The cwd fallback is retained only for this strict worker-worktree path.
 */
export async function resolveWorkerTeamStateRoot(cwd, worker, env = process.env) {
    return resolveWorkerTeamStateRootWithOptions(cwd, worker, env, {
        allowCwdFallback: true,
        preferMetadataRoot: false,
    });
}
/**
 * Resolve the team state root for non-git worker notify hooks.
 *
 * Notify hooks update heartbeat/idle/dispatch state and may run in contexts that
 * are not safe git operation contexts. They must still be worker-aware, but they
 * must not invent `cwd/.omx/state` when the runtime did not provide a canonical
 * root hint. Only explicit environment/leader metadata roots are considered, and
 * all successful roots still require a matching worker identity.
 */
export async function resolveWorkerNotifyTeamStateRoot(cwd, worker, env = process.env) {
    const explicit = typeof env.OMX_TEAM_STATE_ROOT === 'string' ? env.OMX_TEAM_STATE_ROOT.trim() : '';
    if (explicit) {
        const resolved = await validateWorkerNotifyStateRoot(resolve(cwd, explicit), 'env', cwd, worker);
        if (resolved.ok)
            return resolved;
        return { ...resolved, source: 'env' };
    }
    const leaderCwd = typeof env.OMX_TEAM_LEADER_CWD === 'string' ? env.OMX_TEAM_LEADER_CWD.trim() : '';
    const leaderStateRoot = leaderCwd ? join(resolve(cwd, leaderCwd), '.omx', 'state') : '';
    if (!leaderStateRoot) {
        return {
            ok: false,
            stateRoot: null,
            source: null,
            reason: 'no_valid_worker_state_root',
        };
    }
    const direct = await validateWorkerNotifyStateRoot(leaderStateRoot, 'leader_cwd', cwd, worker);
    if (!direct.ok)
        return direct;
    for (const [filename, source] of [
        ['identity.json', 'identity_metadata'],
        ['manifest.v2.json', 'manifest_metadata'],
        ['config.json', 'config_metadata'],
    ]) {
        const metadataRoot = filename === 'identity.json'
            ? await readMetadataRootFromValidatedCandidate(leaderStateRoot, filename, cwd, worker)
            : await readTeamMetadataRootFromCandidate(leaderStateRoot, filename, cwd, worker);
        if (!metadataRoot)
            continue;
        const resolved = await validateWorkerNotifyStateRoot(resolve(cwd, metadataRoot), source, cwd, worker);
        if (resolved.ok)
            return resolved;
    }
    return direct;
}
export async function resolveWorkerTeamStateRootPath(cwd, worker, env = process.env) {
    const resolved = await resolveWorkerTeamStateRoot(cwd, worker, env);
    return resolved.ok ? resolved.stateRoot : null;
}
export async function resolveWorkerNotifyTeamStateRootPath(cwd, worker, env = process.env) {
    const resolved = await resolveWorkerNotifyTeamStateRoot(cwd, worker, env);
    return resolved.ok ? resolved.stateRoot : null;
}
//# sourceMappingURL=state-root.js.map