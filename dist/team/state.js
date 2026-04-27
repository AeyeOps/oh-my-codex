import { appendFile, readFile, writeFile, mkdir, rm, rename, readdir } from 'fs/promises';
import { join, dirname, resolve, sep } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { readUsableSessionState } from '../hooks/session.js';
import { omxStateDir } from '../utils/paths.js';
import { isTerminalPhase } from './orchestrator.js';
import { computeTaskReadiness as computeTaskReadinessImpl, claimTask as claimTaskImpl, transitionTaskStatus as transitionTaskStatusImpl, releaseTaskClaim as releaseTaskClaimImpl, reclaimExpiredTaskClaim as reclaimExpiredTaskClaimImpl, listTasks as listTasksImpl, } from './state/tasks.js';
import { sendDirectMessage as sendDirectMessageImpl, broadcastMessage as broadcastMessageImpl, markMessageDelivered as markMessageDeliveredImpl, markMessageNotified as markMessageNotifiedImpl, listMailboxMessages as listMailboxMessagesImpl, normalizeBridgeMailboxMessage, } from './state/mailbox.js';
import { enqueueDispatchRequest as enqueueDispatchRequestImpl, listDispatchRequests as listDispatchRequestsImpl, readDispatchRequest as readDispatchRequestImpl, transitionDispatchRequest as transitionDispatchRequestImpl, markDispatchRequestNotified as markDispatchRequestNotifiedImpl, markDispatchRequestDelivered as markDispatchRequestDeliveredImpl, normalizeBridgeDispatchRecord, normalizeDispatchRequest as normalizeDispatchRequestImpl, } from './state/dispatch.js';
import { resolveDispatchLockTimeoutMs as resolveDispatchLockTimeoutMsImpl, withDispatchLock as withDispatchLockImpl, } from './state/dispatch-lock.js';
import { writeTaskApproval as writeTaskApprovalImpl, readTaskApproval as readTaskApprovalImpl, } from './state/approvals.js';
import { getTeamSummary as getTeamSummaryImpl, readMonitorSnapshot as readMonitorSnapshotImpl, writeMonitorSnapshot as writeMonitorSnapshotImpl, readTeamPhase as readTeamPhaseImpl, writeTeamPhase as writeTeamPhaseImpl, } from './state/monitor.js';
import { withScalingLock as withScalingLockImpl, withTeamLock as withTeamLockImpl, withTaskClaimLock as withTaskClaimLockImpl, withMailboxLock as withMailboxLockImpl, } from './state/locks.js';
import { getDefaultBridge, isBridgeEnabled, resolveBridgeStateDir } from '../runtime/bridge.js';
import { TEAM_NAME_SAFE_PATTERN, WORKER_NAME_SAFE_PATTERN, TASK_ID_SAFE_PATTERN, TEAM_TASK_STATUSES, canTransitionTeamTaskStatus, isTerminalTeamTaskStatus, } from './contracts.js';
let renameForAtomicWrite = rename;
export function setWriteAtomicRenameForTests(fn) {
    renameForAtomicWrite = fn;
}
export function resetWriteAtomicRenameForTests() {
    renameForAtomicWrite = rename;
}
export const DEFAULT_MAX_WORKERS = 20;
export const ABSOLUTE_MAX_WORKERS = 20;
const LOCK_STALE_MS = 5 * 60 * 1000;
// Hook-preferred delivery can wait for the fallback watcher tick plus tmux
// injection verification; keep the default ack budget above that steady-state
// control-plane cadence to avoid spurious fallback/failed confirmations.
const DEFAULT_DISPATCH_ACK_TIMEOUT_MS = 2_000;
const MIN_DISPATCH_ACK_TIMEOUT_MS = 100;
const MAX_DISPATCH_ACK_TIMEOUT_MS = 10_000;
function isTerminalTaskStatus(status) {
    return isTerminalTeamTaskStatus(status);
}
function canTransitionTaskStatus(from, to) {
    return canTransitionTeamTaskStatus(from, to);
}
function assertPathWithinDir(filePath, rootDir) {
    const normalizedRoot = resolve(rootDir);
    const normalizedPath = resolve(filePath);
    if (normalizedPath !== normalizedRoot && !normalizedPath.startsWith(normalizedRoot + sep)) {
        throw new Error('Path traversal detected: path is outside the allowed directory');
    }
}
function validateWorkerName(name) {
    if (!WORKER_NAME_SAFE_PATTERN.test(name)) {
        throw new Error(`Invalid worker name: "${name}". Must match /^[a-z0-9][a-z0-9-]{0,63}$/ (lowercase alphanumeric + hyphens, max 64 chars).`);
    }
}
function validateTaskId(taskId) {
    if (!TASK_ID_SAFE_PATTERN.test(taskId)) {
        throw new Error(`Invalid task ID: "${taskId}". Must be a positive integer (digits only, max 20 digits).`);
    }
}
function defaultLeader() {
    return {
        session_id: '',
        worker_id: 'leader-fixed',
        role: 'coordinator',
    };
}
function defaultPolicy(displayMode = 'auto', workerLaunchMode = 'interactive') {
    return {
        display_mode: displayMode,
        worker_launch_mode: workerLaunchMode,
        dispatch_mode: 'hook_preferred_with_fallback',
        dispatch_ack_timeout_ms: DEFAULT_DISPATCH_ACK_TIMEOUT_MS,
    };
}
function defaultGovernance() {
    return {
        delegation_only: false,
        plan_approval_required: false,
        nested_teams_allowed: false,
        one_team_per_leader_session: true,
        cleanup_requires_all_workers_inactive: true,
    };
}
function clampDispatchAckTimeoutMs(raw) {
    const asNum = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(asNum))
        return DEFAULT_DISPATCH_ACK_TIMEOUT_MS;
    const floored = Math.floor(asNum);
    return Math.max(MIN_DISPATCH_ACK_TIMEOUT_MS, Math.min(MAX_DISPATCH_ACK_TIMEOUT_MS, floored));
}
export function normalizeTeamPolicy(policy, defaults = { display_mode: 'auto', worker_launch_mode: 'interactive' }) {
    const base = defaultPolicy(defaults.display_mode, defaults.worker_launch_mode);
    const dispatchMode = policy?.dispatch_mode === 'transport_direct'
        ? 'transport_direct'
        : 'hook_preferred_with_fallback';
    return {
        worker_launch_mode: policy?.worker_launch_mode === 'prompt' ? 'prompt' : base.worker_launch_mode,
        display_mode: policy?.display_mode === 'split_pane' ? 'split_pane' : base.display_mode,
        dispatch_mode: dispatchMode,
        dispatch_ack_timeout_ms: clampDispatchAckTimeoutMs(policy?.dispatch_ack_timeout_ms),
    };
}
export function normalizeTeamGovernance(governance, legacyPolicy = null) {
    const source = governance ?? legacyPolicy ?? {};
    return {
        delegation_only: source?.delegation_only === true,
        plan_approval_required: source?.plan_approval_required === true,
        nested_teams_allowed: source?.nested_teams_allowed === true,
        one_team_per_leader_session: source?.one_team_per_leader_session !== false,
        cleanup_requires_all_workers_inactive: source?.cleanup_requires_all_workers_inactive !== false,
    };
}
function defaultPermissionsSnapshot() {
    return {
        approval_mode: 'unknown',
        sandbox_mode: 'unknown',
        network_access: true,
    };
}
function readEnvValue(env, keys) {
    for (const key of keys) {
        const value = env[key];
        if (typeof value === 'string' && value.trim() !== '')
            return value.trim();
    }
    return null;
}
function parseOptionalBoolean(raw) {
    if (!raw)
        return null;
    const normalized = raw.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enabled', 'allow', 'allowed'].includes(normalized))
        return true;
    if (['0', 'false', 'no', 'off', 'disabled', 'deny', 'denied'].includes(normalized))
        return false;
    return null;
}
function resolveDisplayModeFromEnv(env) {
    const raw = readEnvValue(env, ['OMX_TEAM_DISPLAY_MODE', 'OMX_TEAM_MODE']);
    if (!raw)
        return 'auto';
    if (raw === 'in_process' || raw === 'in-process')
        return 'split_pane';
    if (raw === 'split_pane' || raw === 'tmux')
        return 'split_pane';
    if (raw === 'auto')
        return 'auto';
    return 'auto';
}
function resolveWorkerLaunchModeFromEnv(env) {
    const raw = readEnvValue(env, ['OMX_TEAM_WORKER_LAUNCH_MODE']);
    if (!raw || raw === 'interactive')
        return 'interactive';
    if (raw === 'prompt')
        return 'prompt';
    throw new Error(`Invalid OMX_TEAM_WORKER_LAUNCH_MODE value "${raw}". Expected: interactive, prompt`);
}
function resolvePermissionsSnapshot(env) {
    const snapshot = defaultPermissionsSnapshot();
    const approvalMode = readEnvValue(env, [
        'OMX_APPROVAL_MODE',
        'CODEX_APPROVAL_MODE',
        'CODEX_APPROVAL_POLICY',
        'CLAUDE_CODE_APPROVAL_MODE',
    ]);
    if (approvalMode)
        snapshot.approval_mode = approvalMode;
    const sandboxMode = readEnvValue(env, ['OMX_SANDBOX_MODE', 'CODEX_SANDBOX_MODE', 'SANDBOX_MODE']);
    if (sandboxMode)
        snapshot.sandbox_mode = sandboxMode;
    const network = parseOptionalBoolean(readEnvValue(env, ['OMX_NETWORK_ACCESS', 'CODEX_NETWORK_ACCESS', 'NETWORK_ACCESS']));
    if (network !== null)
        snapshot.network_access = network;
    else if (snapshot.sandbox_mode.toLowerCase().includes('offline'))
        snapshot.network_access = false;
    return snapshot;
}
async function resolveLeaderSessionId(cwd, env) {
    const fromEnv = readEnvValue(env, ['OMX_SESSION_ID', 'CODEX_SESSION_ID', 'SESSION_ID']);
    if (fromEnv)
        return fromEnv;
    return (await readUsableSessionState(cwd))?.session_id ?? '';
}
function normalizeTask(task) {
    return {
        ...task,
        depends_on: task.depends_on ?? task.blocked_by ?? [],
        version: Math.max(1, task.version ?? 1),
    };
}
// Team state directory: .omx/state/team/{teamName}/
function resolveTeamStateRoot(cwd, env = process.env) {
    const explicit = env.OMX_TEAM_STATE_ROOT;
    if (typeof explicit === 'string' && explicit.trim() !== '') {
        return resolve(cwd, explicit.trim());
    }
    return omxStateDir(cwd);
}
function teamDir(teamName, cwd) {
    return join(resolveTeamStateRoot(cwd), 'team', teamName);
}
function workerDir(teamName, workerName, cwd) {
    return join(teamDir(teamName, cwd), 'workers', workerName);
}
function teamConfigPath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'config.json');
}
function teamManifestV2Path(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'manifest.v2.json');
}
function taskClaimLockDir(teamName, taskId, cwd) {
    validateTaskId(taskId);
    const p = join(teamDir(teamName, cwd), 'claims', `task-${taskId}.lock`);
    assertPathWithinDir(p, resolveTeamStateRoot(cwd));
    return p;
}
export function teamEventLogPath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'events', 'events.ndjson');
}
function mailboxPath(teamName, workerName, cwd) {
    validateWorkerName(workerName);
    const p = join(teamDir(teamName, cwd), 'mailbox', `${workerName}.json`);
    assertPathWithinDir(p, resolveTeamStateRoot(cwd));
    return p;
}
function mailboxLockDir(teamName, workerName, cwd) {
    validateWorkerName(workerName);
    const p = join(teamDir(teamName, cwd), 'mailbox', `.lock-${workerName}`);
    assertPathWithinDir(p, resolveTeamStateRoot(cwd));
    return p;
}
function dispatchRequestsPath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'dispatch', 'requests.json');
}
function dispatchLockDir(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'dispatch', '.lock');
}
function approvalPath(teamName, taskId, cwd) {
    validateTaskId(taskId);
    const p = join(teamDir(teamName, cwd), 'approvals', `task-${taskId}.json`);
    assertPathWithinDir(p, resolveTeamStateRoot(cwd));
    return p;
}
function summarySnapshotPath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'summary-snapshot.json');
}
// Validate team name: alphanumeric + hyphens only, max 30 chars
function validateTeamName(name) {
    if (!TEAM_NAME_SAFE_PATTERN.test(name)) {
        throw new Error(`Invalid team name: "${name}". Team name must match /^[a-z0-9][a-z0-9-]{0,29}$/ (lowercase alphanumeric + hyphens, max 30 chars).`);
    }
}
function isWorkerHeartbeat(value) {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    return (typeof v.pid === 'number' &&
        typeof v.last_turn_at === 'string' &&
        typeof v.turn_count === 'number' &&
        typeof v.alive === 'boolean');
}
function isWorkerStatus(value) {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    const state = v.state;
    const allowed = ['idle', 'working', 'blocked', 'done', 'failed', 'draining', 'unknown'];
    if (typeof state !== 'string' || !allowed.includes(state))
        return false;
    return typeof v.updated_at === 'string';
}
function isTeamTask(value) {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    if (typeof v.id !== 'string')
        return false;
    if (typeof v.subject !== 'string')
        return false;
    if (typeof v.description !== 'string')
        return false;
    if (typeof v.status !== 'string' || !TEAM_TASK_STATUSES.includes(v.status))
        return false;
    if (typeof v.created_at !== 'string')
        return false;
    return true;
}
function isTeamManifestV2(value) {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    if (v.schema_version !== 2)
        return false;
    if (typeof v.name !== 'string')
        return false;
    if (typeof v.task !== 'string')
        return false;
    if (typeof v.tmux_session !== 'string')
        return false;
    if (typeof v.worker_count !== 'number')
        return false;
    if (typeof v.next_task_id !== 'number')
        return false;
    if (typeof v.created_at !== 'string')
        return false;
    if (!Array.isArray(v.workers))
        return false;
    if (!(typeof v.leader_pane_id === 'string' || v.leader_pane_id === null))
        return false;
    if (!(typeof v.hud_pane_id === 'string' || v.hud_pane_id === null))
        return false;
    if (!(typeof v.resize_hook_name === 'string' || v.resize_hook_name === null))
        return false;
    if (!(typeof v.resize_hook_target === 'string' || v.resize_hook_target === null))
        return false;
    if (!v.leader || typeof v.leader !== 'object')
        return false;
    if (!v.policy || typeof v.policy !== 'object')
        return false;
    if (!v.permissions_snapshot || typeof v.permissions_snapshot !== 'object')
        return false;
    return true;
}
// Atomic write: write to {path}.tmp.{pid}, then rename
export async function writeAtomic(filePath, data) {
    const parent = dirname(filePath);
    await mkdir(parent, { recursive: true });
    const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}`;
    await writeFile(tmpPath, data, 'utf8');
    try {
        await renameForAtomicWrite(tmpPath, filePath);
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT' && existsSync(filePath)) {
            try {
                const existing = await readFile(filePath, 'utf8');
                if (existing === data)
                    return;
            }
            catch {
                // Preserve original ENOENT below if destination cannot be read.
            }
        }
        throw error;
    }
}
// Initialize team state directory + config.json
// Creates: .omx/state/team/{name}/, workers/{worker-1}..{worker-N}/, tasks/
// Throws if workerCount > maxWorkers (default 20)
export async function initTeamState(teamName, task, agentType, workerCount, cwd, maxWorkers = DEFAULT_MAX_WORKERS, env = process.env, workspace = {}, lifecycleProfile = 'default') {
    validateTeamName(teamName);
    if (maxWorkers > ABSOLUTE_MAX_WORKERS) {
        throw new Error(`maxWorkers (${maxWorkers}) exceeds ABSOLUTE_MAX_WORKERS (${ABSOLUTE_MAX_WORKERS})`);
    }
    if (workerCount > maxWorkers) {
        throw new Error(`workerCount (${workerCount}) exceeds maxWorkers (${maxWorkers})`);
    }
    const root = teamDir(teamName, cwd);
    const workersRoot = join(root, 'workers');
    const tasksRoot = join(root, 'tasks');
    const claimsRoot = join(root, 'claims');
    const mailboxRoot = join(root, 'mailbox');
    const dispatchRoot = join(root, 'dispatch');
    const eventsRoot = join(root, 'events');
    const approvalsRoot = join(root, 'approvals');
    await mkdir(workersRoot, { recursive: true });
    await mkdir(tasksRoot, { recursive: true });
    await mkdir(claimsRoot, { recursive: true });
    await mkdir(mailboxRoot, { recursive: true });
    await mkdir(dispatchRoot, { recursive: true });
    await mkdir(eventsRoot, { recursive: true });
    await mkdir(approvalsRoot, { recursive: true });
    await writeAtomic(join(dispatchRoot, 'requests.json'), JSON.stringify([], null, 2));
    const workers = [];
    for (let i = 1; i <= workerCount; i++) {
        const name = `worker-${i}`;
        const worker = { name, index: i, role: agentType, assigned_tasks: [] };
        workers.push(worker);
        await mkdir(join(workersRoot, name), { recursive: true });
    }
    const leaderSessionId = await resolveLeaderSessionId(cwd, env);
    const leaderWorkerId = readEnvValue(env, ['OMX_TEAM_WORKER']) ?? 'leader-fixed';
    const displayMode = resolveDisplayModeFromEnv(env);
    const permissionsSnapshot = resolvePermissionsSnapshot(env);
    const workerLaunchMode = resolveWorkerLaunchModeFromEnv(env);
    const config = {
        name: teamName,
        task,
        agent_type: agentType,
        worker_launch_mode: workerLaunchMode,
        lifecycle_profile: lifecycleProfile,
        worker_count: workerCount,
        max_workers: maxWorkers,
        workers,
        created_at: new Date().toISOString(),
        tmux_session: `omx-team-${teamName}`,
        next_task_id: 1,
        leader_cwd: workspace.leader_cwd,
        team_state_root: workspace.team_state_root,
        workspace_mode: workspace.workspace_mode,
        worktree_mode: workspace.worktree_mode,
        leader_pane_id: null,
        hud_pane_id: null,
        resize_hook_name: null,
        resize_hook_target: null,
        next_worker_index: workerCount + 1,
    };
    await writeAtomic(join(root, 'config.json'), JSON.stringify(config, null, 2));
    await writeTeamPhase(teamName, {
        current_phase: 'team-exec',
        max_fix_attempts: 3,
        current_fix_attempt: 0,
        transitions: [],
        updated_at: new Date().toISOString(),
    }, cwd);
    await writeTeamManifestV2({
        schema_version: 2,
        name: teamName,
        task,
        leader: {
            ...defaultLeader(),
            session_id: leaderSessionId,
            worker_id: leaderWorkerId,
        },
        policy: defaultPolicy(displayMode, workerLaunchMode),
        governance: defaultGovernance(),
        lifecycle_profile: lifecycleProfile,
        permissions_snapshot: permissionsSnapshot,
        tmux_session: config.tmux_session,
        worker_count: workerCount,
        workers,
        next_task_id: 1,
        created_at: config.created_at,
        leader_cwd: workspace.leader_cwd,
        team_state_root: workspace.team_state_root,
        workspace_mode: workspace.workspace_mode,
        worktree_mode: workspace.worktree_mode,
        leader_pane_id: null,
        hud_pane_id: null,
        resize_hook_name: null,
        resize_hook_target: null,
        next_worker_index: workerCount + 1,
    }, cwd);
    return config;
}
async function writeConfig(cfg, cwd) {
    const normalized = normalizeTeamConfig(cfg);
    const p = teamConfigPath(normalized.name, cwd);
    await writeAtomic(p, JSON.stringify(normalized, null, 2));
    // Keep v2 manifest in sync when present. Don't create it implicitly here to preserve migration behavior.
    const existing = await readTeamManifestV2(normalized.name, cwd);
    if (existing) {
        const merged = {
            ...existing,
            task: normalized.task,
            tmux_session: normalized.tmux_session,
            worker_count: normalized.worker_count,
            workers: normalized.workers,
            lifecycle_profile: normalized.lifecycle_profile,
            next_task_id: normalizeNextTaskId(normalized.next_task_id),
            leader_cwd: normalized.leader_cwd,
            team_state_root: normalized.team_state_root,
            workspace_mode: normalized.workspace_mode,
            worktree_mode: normalized.worktree_mode,
            leader_pane_id: normalized.leader_pane_id,
            hud_pane_id: normalized.hud_pane_id,
            resize_hook_name: normalized.resize_hook_name,
            resize_hook_target: normalized.resize_hook_target,
            next_worker_index: normalized.next_worker_index ?? existing.next_worker_index,
        };
        await writeTeamManifestV2(merged, cwd);
    }
}
function teamConfigFromManifest(manifest) {
    const normalizedPolicy = normalizeTeamPolicy(manifest.policy, {
        display_mode: manifest.policy?.display_mode === 'split_pane' ? 'split_pane' : 'auto',
        worker_launch_mode: manifest.policy?.worker_launch_mode === 'prompt' ? 'prompt' : 'interactive',
    });
    const workerLaunchMode = normalizedPolicy.worker_launch_mode;
    return {
        name: manifest.name,
        task: manifest.task,
        agent_type: manifest.workers[0]?.role ?? 'executor',
        worker_launch_mode: workerLaunchMode,
        lifecycle_profile: manifest.lifecycle_profile,
        worker_count: manifest.worker_count,
        max_workers: DEFAULT_MAX_WORKERS,
        workers: manifest.workers,
        created_at: manifest.created_at,
        tmux_session: manifest.tmux_session,
        next_task_id: manifest.next_task_id,
        leader_cwd: manifest.leader_cwd,
        team_state_root: manifest.team_state_root,
        workspace_mode: manifest.workspace_mode,
        worktree_mode: manifest.worktree_mode,
        leader_pane_id: manifest.leader_pane_id,
        hud_pane_id: manifest.hud_pane_id,
        resize_hook_name: manifest.resize_hook_name,
        resize_hook_target: manifest.resize_hook_target,
        next_worker_index: manifest.next_worker_index,
    };
}
function normalizeTeamConfig(config) {
    const workerLaunchMode = config.worker_launch_mode === 'prompt' ? 'prompt' : 'interactive';
    return {
        ...config,
        lifecycle_profile: 'default',
        leader_pane_id: config.leader_pane_id ?? null,
        hud_pane_id: config.hud_pane_id ?? null,
        resize_hook_name: config.resize_hook_name ?? null,
        resize_hook_target: config.resize_hook_target ?? null,
        worker_launch_mode: workerLaunchMode,
    };
}
function teamManifestFromConfig(config) {
    const normalized = normalizeTeamConfig(config);
    const policy = normalizeTeamPolicy({
        worker_launch_mode: normalized.worker_launch_mode,
    }, {
        display_mode: 'auto',
        worker_launch_mode: normalized.worker_launch_mode,
    });
    return {
        schema_version: 2,
        name: normalized.name,
        task: normalized.task,
        leader: defaultLeader(),
        policy,
        governance: defaultGovernance(),
        lifecycle_profile: normalized.lifecycle_profile,
        permissions_snapshot: defaultPermissionsSnapshot(),
        tmux_session: normalized.tmux_session,
        worker_count: normalized.worker_count,
        workers: normalized.workers,
        next_task_id: normalizeNextTaskId(normalized.next_task_id),
        created_at: normalized.created_at,
        leader_cwd: normalized.leader_cwd,
        team_state_root: normalized.team_state_root,
        workspace_mode: normalized.workspace_mode,
        worktree_mode: normalized.worktree_mode,
        leader_pane_id: normalized.leader_pane_id,
        hud_pane_id: normalized.hud_pane_id,
        resize_hook_name: normalized.resize_hook_name,
        resize_hook_target: normalized.resize_hook_target,
        next_worker_index: normalized.next_worker_index,
    };
}
export async function writeTeamManifestV2(manifest, cwd) {
    const normalizedPolicy = normalizeTeamPolicy(manifest.policy, {
        display_mode: manifest.policy?.display_mode === 'split_pane' ? 'split_pane' : 'auto',
        worker_launch_mode: manifest.policy?.worker_launch_mode === 'prompt' ? 'prompt' : 'interactive',
    });
    const normalizedGovernance = normalizeTeamGovernance(manifest.governance, manifest.policy);
    const p = teamManifestV2Path(manifest.name, cwd);
    await writeAtomic(p, JSON.stringify({
        ...manifest,
        policy: normalizedPolicy,
        governance: normalizedGovernance,
        lifecycle_profile: 'default',
    }, null, 2));
}
export async function readTeamManifestV2(teamName, cwd) {
    try {
        const p = teamManifestV2Path(teamName, cwd);
        if (!existsSync(p))
            return null;
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (!isTeamManifestV2(parsed))
            return null;
        const parsedManifest = parsed;
        return {
            ...parsedManifest,
            policy: normalizeTeamPolicy(parsedManifest.policy, {
                display_mode: parsedManifest.policy?.display_mode === 'split_pane' ? 'split_pane' : 'auto',
                worker_launch_mode: parsedManifest.policy?.worker_launch_mode === 'prompt' ? 'prompt' : 'interactive',
            }),
            governance: normalizeTeamGovernance(parsedManifest.governance, parsedManifest.policy),
            lifecycle_profile: 'default',
        };
    }
    catch {
        return null;
    }
}
// Idempotent migration; keeps config.json untouched.
export async function migrateV1ToV2(teamName, cwd) {
    const existing = await readTeamManifestV2(teamName, cwd);
    if (existing)
        return existing;
    try {
        const p = teamConfigPath(teamName, cwd);
        if (!existsSync(p))
            return null;
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        const manifest = teamManifestFromConfig(parsed);
        await writeTeamManifestV2(manifest, cwd);
        return await readTeamManifestV2(teamName, cwd);
    }
    catch {
        return null;
    }
}
function normalizeNextTaskId(raw) {
    const asNum = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(asNum))
        return 1;
    const floored = Math.floor(asNum);
    return Math.max(1, floored);
}
function hasValidNextTaskId(raw) {
    const asNum = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(asNum) && Math.floor(asNum) >= 1;
}
async function computeNextTaskIdFromDisk(teamName, cwd) {
    const tasksRoot = join(teamDir(teamName, cwd), 'tasks');
    if (!existsSync(tasksRoot))
        return 1;
    let maxId = 0;
    try {
        const files = await readdir(tasksRoot);
        for (const f of files) {
            const m = /^task-(\d+)\.json$/.exec(f);
            if (!m)
                continue;
            const id = Number(m[1]);
            if (Number.isFinite(id) && id > maxId)
                maxId = id;
        }
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT')
            return 1;
        throw error;
    }
    return maxId + 1;
}
// Read team config
export async function readTeamConfig(teamName, cwd) {
    const v2 = await readTeamManifestV2(teamName, cwd);
    if (v2)
        return teamConfigFromManifest(v2);
    // Attempt idempotent migration on first read.
    const migrated = await migrateV1ToV2(teamName, cwd);
    if (migrated)
        return teamConfigFromManifest(migrated);
    try {
        const p = teamConfigPath(teamName, cwd);
        if (!existsSync(p))
            return null;
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        return normalizeTeamConfig(parsed);
    }
    catch {
        return null;
    }
}
// Write worker identity file
export async function writeWorkerIdentity(teamName, workerName, identity, cwd) {
    const p = join(workerDir(teamName, workerName, cwd), 'identity.json');
    await writeAtomic(p, JSON.stringify(identity, null, 2));
}
// Read worker heartbeat (returns null on missing/malformed)
export async function readWorkerHeartbeat(teamName, workerName, cwd) {
    const p = join(workerDir(teamName, workerName, cwd), 'heartbeat.json');
    try {
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        return isWorkerHeartbeat(parsed) ? parsed : null;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return null;
        return null;
    }
}
// Atomic write worker heartbeat
export async function updateWorkerHeartbeat(teamName, workerName, heartbeat, cwd) {
    const p = join(workerDir(teamName, workerName, cwd), 'heartbeat.json');
    await writeAtomic(p, JSON.stringify(heartbeat, null, 2));
}
// Read worker status (returns {state:'unknown'} on missing/malformed)
export async function readWorkerStatus(teamName, workerName, cwd) {
    const unknownStatus = { state: 'unknown', updated_at: '1970-01-01T00:00:00.000Z' };
    const p = join(workerDir(teamName, workerName, cwd), 'status.json');
    try {
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (!isWorkerStatus(parsed)) {
            return unknownStatus;
        }
        return parsed;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return unknownStatus;
        return unknownStatus;
    }
}
// Atomic write worker status
export async function writeWorkerStatus(teamName, workerName, status, cwd) {
    const p = join(workerDir(teamName, workerName, cwd), 'status.json');
    await writeAtomic(p, JSON.stringify(status, null, 2));
}
// File-based scaling lock to prevent concurrent scale_up/scale_down operations
export async function withScalingLock(teamName, cwd, fn) {
    return await withScalingLockImpl(teamName, cwd, LOCK_STALE_MS, { teamDir, taskClaimLockDir, mailboxLockDir }, fn);
}
// Write prompt to worker's inbox.md (atomic)
export async function writeWorkerInbox(teamName, workerName, prompt, cwd) {
    const p = join(workerDir(teamName, workerName, cwd), 'inbox.md');
    await writeAtomic(p, prompt);
}
function taskFilePath(teamName, taskId, cwd) {
    validateTaskId(taskId);
    const p = join(teamDir(teamName, cwd), 'tasks', `task-${taskId}.json`);
    assertPathWithinDir(p, resolveTeamStateRoot(cwd));
    return p;
}
async function withTeamLock(teamName, cwd, fn) {
    return await withTeamLockImpl(teamName, cwd, LOCK_STALE_MS, { teamDir, taskClaimLockDir, mailboxLockDir }, fn);
}
async function withTaskClaimLock(teamName, taskId, cwd, fn) {
    return await withTaskClaimLockImpl(teamName, taskId, cwd, LOCK_STALE_MS, { teamDir, taskClaimLockDir, mailboxLockDir }, fn);
}
async function withMailboxLock(teamName, workerName, cwd, fn) {
    return await withMailboxLockImpl(teamName, workerName, cwd, LOCK_STALE_MS, { teamDir, taskClaimLockDir, mailboxLockDir }, fn);
}
// Create a task (auto-increment ID)
export async function createTask(teamName, task, cwd) {
    return withTeamLock(teamName, cwd, async () => {
        const cfg = await readTeamConfig(teamName, cwd);
        if (!cfg)
            throw new Error(`Team ${teamName} not found`);
        let nextNumeric = normalizeNextTaskId(cfg.next_task_id);
        const nextNumericFromDisk = await computeNextTaskIdFromDisk(teamName, cwd);
        if (!hasValidNextTaskId(cfg.next_task_id) || nextNumericFromDisk > nextNumeric) {
            nextNumeric = nextNumericFromDisk;
        }
        const nextId = String(nextNumeric);
        const created = {
            ...task,
            id: nextId,
            status: task.status ?? 'pending',
            depends_on: task.depends_on ?? task.blocked_by ?? [],
            version: 1,
            created_at: new Date().toISOString(),
        };
        await writeAtomic(taskFilePath(teamName, nextId, cwd), JSON.stringify(created, null, 2));
        // Advance counter after the task is safely persisted.
        cfg.next_task_id = nextNumeric + 1;
        await writeConfig(cfg, cwd);
        return created;
    });
}
// Read a task (returns null on missing/malformed)
export async function readTask(teamName, taskId, cwd) {
    try {
        const p = taskFilePath(teamName, taskId, cwd);
        if (!existsSync(p))
            return null;
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        return isTeamTask(parsed) ? normalizeTask(parsed) : null;
    }
    catch {
        return null;
    }
}
// Update a task (merge updates, atomic write)
export async function updateTask(teamName, taskId, updates, cwd) {
    const lock = await withTaskClaimLock(teamName, taskId, cwd, async () => {
        const existing = await readTask(teamName, taskId, cwd);
        if (!existing)
            return null;
        if (updates.status !== undefined && !['pending', 'blocked', 'in_progress', 'completed', 'failed'].includes(updates.status)) {
            throw new Error(`Invalid task status: ${updates.status}`);
        }
        const rawDeps = updates.depends_on ?? updates.blocked_by ?? existing.depends_on ?? existing.blocked_by ?? [];
        const normalizedDeps = Array.isArray(rawDeps) ? rawDeps : [];
        const merged = {
            ...normalizeTask(existing),
            ...updates,
            id: existing.id,
            created_at: existing.created_at,
            depends_on: normalizedDeps,
            version: Math.max(1, existing.version ?? 1) + 1,
        };
        await writeAtomic(taskFilePath(teamName, taskId, cwd), JSON.stringify(merged, null, 2));
        return merged;
    });
    if (!lock.ok) {
        throw new Error(`Timed out acquiring task claim lock for ${teamName}/${taskId}`);
    }
    return lock.value;
}
// List all tasks sorted by numeric ID
export async function listTasks(teamName, cwd) {
    return await listTasksImpl(teamName, cwd, {
        teamDir,
        isTeamTask,
        normalizeTask,
    });
}
export async function computeTaskReadiness(teamName, taskId, cwd) {
    return await computeTaskReadinessImpl(teamName, taskId, cwd, { readTask });
}
export async function claimTask(teamName, taskId, workerName, expectedVersion, cwd) {
    return await claimTaskImpl(taskId, workerName, expectedVersion, {
        teamName,
        cwd,
        readTask,
        readTeamConfig,
        withTaskClaimLock,
        normalizeTask,
        isTerminalTaskStatus,
        taskFilePath,
        writeAtomic,
    });
}
export async function transitionTaskStatus(teamName, taskId, from, to, claimToken, cwd, terminalData) {
    return await transitionTaskStatusImpl(taskId, from, to, claimToken, terminalData, {
        teamName,
        cwd,
        readTask,
        readTeamConfig,
        withTaskClaimLock,
        normalizeTask,
        isTerminalTaskStatus,
        canTransitionTaskStatus,
        taskFilePath,
        writeAtomic,
        appendTeamEvent,
        readMonitorSnapshot,
        writeMonitorSnapshot,
    });
}
export async function releaseTaskClaim(teamName, taskId, claimToken, workerName, cwd) {
    return await releaseTaskClaimImpl(taskId, claimToken, workerName, {
        teamName,
        cwd,
        readTask,
        readTeamConfig,
        withTaskClaimLock,
        normalizeTask,
        isTerminalTaskStatus,
        taskFilePath,
        writeAtomic,
    });
}
export async function reclaimExpiredTaskClaim(teamName, taskId, cwd) {
    return await reclaimExpiredTaskClaimImpl(taskId, {
        teamName,
        cwd,
        readTask,
        readTeamConfig,
        withTaskClaimLock,
        normalizeTask,
        isTerminalTaskStatus,
        taskFilePath,
        writeAtomic,
    });
}
export async function appendTeamEvent(teamName, event, cwd) {
    const full = {
        ...event,
        event_id: randomUUID(),
        team: teamName,
        created_at: new Date().toISOString(),
    };
    const p = teamEventLogPath(teamName, cwd);
    await mkdir(dirname(p), { recursive: true });
    await appendFile(p, `${JSON.stringify(full)}\n`, 'utf8');
    return full;
}
async function readMailbox(teamName, workerName, cwd) {
    const legacyMailbox = await readLegacyMailbox(teamName, workerName, cwd);
    if (isBridgeEnabled()) {
        try {
            const bridge = getDefaultBridge(resolveBridgeStateDir(cwd));
            const compat = bridge.readCompatFile('mailbox.json');
            if (compat) {
                const legacyById = new Map(legacyMailbox.messages
                    .filter((message) => typeof message.message_id === 'string' && message.message_id !== '')
                    .map((message) => [message.message_id, message]));
                const bridgeMessages = bridge.readMailboxRecords()
                    .filter((record) => record.to_worker === workerName)
                    .map((record) => {
                    const normalized = normalizeBridgeMailboxMessage(record);
                    if (!normalized.body) {
                        const legacyMessage = legacyById.get(normalized.message_id);
                        if (legacyMessage?.body)
                            return { ...normalized, body: legacyMessage.body };
                    }
                    return normalized;
                });
                return { worker: workerName, messages: bridgeMessages };
            }
        }
        catch {
            // fall through to legacy file fallback
        }
    }
    return legacyMailbox;
}
async function readLegacyMailbox(teamName, workerName, cwd) {
    const p = mailboxPath(teamName, workerName, cwd);
    try {
        if (!existsSync(p))
            return { worker: workerName, messages: [] };
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return { worker: workerName, messages: [] };
        const v = parsed;
        if (v.worker !== workerName || !Array.isArray(v.messages))
            return { worker: workerName, messages: [] };
        return { worker: workerName, messages: v.messages };
    }
    catch {
        return { worker: workerName, messages: [] };
    }
}
async function writeMailbox(teamName, mailbox, cwd) {
    const p = mailboxPath(teamName, mailbox.worker, cwd);
    await writeAtomic(p, JSON.stringify(mailbox, null, 2));
}
async function readDispatchRequests(teamName, cwd) {
    if (isBridgeEnabled()) {
        try {
            const bridge = getDefaultBridge(resolveBridgeStateDir(cwd));
            const compat = bridge.readCompatFile('dispatch.json');
            if (compat) {
                const nowIso = new Date().toISOString();
                return bridge.readDispatchRecords()
                    .map((record) => normalizeBridgeDispatchRecord(teamName, record, nowIso))
                    .filter((record) => record !== null);
            }
        }
        catch {
            // fall through to legacy file fallback
        }
    }
    const path = dispatchRequestsPath(teamName, cwd);
    try {
        if (!existsSync(path))
            return [];
        const raw = await readFile(path, 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        const nowIso = new Date().toISOString();
        return parsed
            .map((entry) => normalizeDispatchRequestImpl(teamName, (entry ?? {}), nowIso))
            .filter((entry) => entry !== null);
    }
    catch {
        return [];
    }
}
async function writeDispatchRequests(teamName, requests, cwd) {
    await writeAtomic(dispatchRequestsPath(teamName, cwd), JSON.stringify(requests, null, 2));
    await writeBridgeDispatchCompat(teamName, requests, cwd);
}
function serializeDispatchRequestToBridgeRecord(request) {
    return {
        request_id: request.request_id,
        target: request.to_worker,
        status: request.status,
        created_at: request.created_at,
        notified_at: request.notified_at ?? null,
        delivered_at: request.delivered_at ?? null,
        failed_at: request.failed_at ?? null,
        reason: request.last_reason ?? null,
        metadata: {
            kind: request.kind,
            team_name: request.team_name,
            worker_index: request.worker_index,
            pane_id: request.pane_id,
            trigger_message: request.trigger_message,
            intent: request.intent,
            message_id: request.message_id,
            inbox_correlation_key: request.inbox_correlation_key,
            transport_preference: request.transport_preference,
            fallback_allowed: request.fallback_allowed,
            attempt_count: request.attempt_count,
        },
    };
}
async function writeBridgeDispatchCompat(teamName, requests, cwd) {
    if (!isBridgeEnabled())
        return;
    const stateDir = resolveBridgeStateDir(cwd);
    const path = join(stateDir, 'dispatch.json');
    const existing = getDefaultBridge(stateDir).readCompatFile('dispatch.json');
    const otherRecords = Array.isArray(existing?.records)
        ? existing.records.filter((record) => {
            const metadata = record?.metadata && typeof record.metadata === 'object'
                ? record.metadata
                : {};
            const metadataTeam = typeof metadata.team_name === 'string' ? metadata.team_name.trim() : '';
            return metadataTeam !== teamName;
        })
        : [];
    const records = [...otherRecords, ...requests.map(serializeDispatchRequestToBridgeRecord)];
    await writeAtomic(path, JSON.stringify({ records }, null, 2));
}
export function resolveDispatchLockTimeoutMs(env = process.env) {
    return resolveDispatchLockTimeoutMsImpl(env);
}
async function withDispatchLock(teamName, cwd, fn) {
    return await withDispatchLockImpl(teamName, cwd, teamDir, dispatchLockDir, fn);
}
export async function enqueueDispatchRequest(teamName, requestInput, cwd) {
    return await enqueueDispatchRequestImpl(requestInput, {
        teamName,
        cwd,
        validateWorkerName,
        withDispatchLock,
        readDispatchRequests,
        writeDispatchRequests,
    });
}
export async function listDispatchRequests(teamName, cwd, opts = {}) {
    return await listDispatchRequestsImpl(opts, {
        teamName,
        cwd,
        validateWorkerName,
        withDispatchLock,
        readDispatchRequests,
        writeDispatchRequests,
    });
}
export async function readDispatchRequest(teamName, requestId, cwd) {
    return await readDispatchRequestImpl(requestId, {
        teamName,
        cwd,
        validateWorkerName,
        withDispatchLock,
        readDispatchRequests,
        writeDispatchRequests,
    });
}
export async function transitionDispatchRequest(teamName, requestId, from, to, patch = {}, cwd) {
    return await transitionDispatchRequestImpl(requestId, from, to, patch, {
        teamName,
        cwd,
        validateWorkerName,
        withDispatchLock,
        readDispatchRequests,
        writeDispatchRequests,
    });
}
export async function markDispatchRequestNotified(teamName, requestId, patch = {}, cwd) {
    return await markDispatchRequestNotifiedImpl(requestId, patch, {
        teamName,
        cwd,
        validateWorkerName,
        withDispatchLock,
        readDispatchRequests,
        writeDispatchRequests,
    });
}
export async function markDispatchRequestDelivered(teamName, requestId, patch = {}, cwd) {
    return await markDispatchRequestDeliveredImpl(requestId, patch, {
        teamName,
        cwd,
        validateWorkerName,
        withDispatchLock,
        readDispatchRequests,
        writeDispatchRequests,
    });
}
export async function sendDirectMessage(teamName, fromWorker, toWorker, body, cwd) {
    return await sendDirectMessageImpl(fromWorker, toWorker, body, {
        teamName,
        cwd,
        withMailboxLock,
        readMailbox,
        readLegacyMailbox,
        writeMailbox,
        appendTeamEvent,
        readTeamConfig,
    });
}
export async function broadcastMessage(teamName, fromWorker, body, cwd) {
    return await broadcastMessageImpl(fromWorker, body, {
        teamName,
        cwd,
        withMailboxLock,
        readMailbox,
        readLegacyMailbox,
        writeMailbox,
        appendTeamEvent,
        readTeamConfig,
    });
}
export async function markMessageDelivered(teamName, workerName, messageId, cwd) {
    return await markMessageDeliveredImpl(workerName, messageId, {
        teamName,
        cwd,
        withMailboxLock,
        readMailbox,
        readLegacyMailbox,
        writeMailbox,
        appendTeamEvent,
        readTeamConfig,
    });
}
export async function markMessageNotified(teamName, workerName, messageId, cwd) {
    return await markMessageNotifiedImpl(workerName, messageId, {
        teamName,
        cwd,
        withMailboxLock,
        readMailbox,
        readLegacyMailbox,
        writeMailbox,
        appendTeamEvent,
        readTeamConfig,
    });
}
export async function listMailboxMessages(teamName, workerName, cwd) {
    return await listMailboxMessagesImpl(workerName, {
        teamName,
        cwd,
        withMailboxLock,
        readMailbox,
        readLegacyMailbox,
        writeMailbox,
        appendTeamEvent,
        readTeamConfig,
    });
}
export async function writeTaskApproval(teamName, approval, cwd) {
    await writeTaskApprovalImpl(approval, {
        teamName,
        cwd,
        approvalPath,
        writeAtomic,
        appendTeamEvent,
    });
}
export async function readTaskApproval(teamName, taskId, cwd) {
    return await readTaskApprovalImpl(taskId, {
        teamName,
        cwd,
        approvalPath,
        writeAtomic,
        appendTeamEvent,
    });
}
// Get team summary with aggregation and non-reporting worker detection
export async function getTeamSummary(teamName, cwd) {
    return await getTeamSummaryImpl({
        teamName,
        cwd,
        readTeamConfig,
        listTasks,
        readWorkerHeartbeat,
        readWorkerStatus,
        summarySnapshotPath,
        monitorSnapshotPath,
        teamPhasePath,
        writeAtomic,
    });
}
export async function writeShutdownRequest(teamName, workerName, requestedBy, cwd) {
    const p = join(workerDir(teamName, workerName, cwd), 'shutdown-request.json');
    await writeAtomic(p, JSON.stringify({ requested_at: new Date().toISOString(), requested_by: requestedBy }, null, 2));
}
export async function readShutdownAck(teamName, workerName, cwd, minUpdatedAt) {
    const ackPath = join(workerDir(teamName, workerName, cwd), 'shutdown-ack.json');
    try {
        const raw = await readFile(ackPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.status !== 'accept' && parsed.status !== 'reject')
            return null;
        if (typeof minUpdatedAt === 'string' && minUpdatedAt.trim() !== '') {
            const minTs = Date.parse(minUpdatedAt);
            const ackTs = Date.parse(parsed.updated_at ?? '');
            if (!Number.isFinite(minTs) || !Number.isFinite(ackTs) || ackTs < minTs)
                return null;
        }
        return parsed;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return null;
        return null;
    }
}
function teamPhasePath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'phase.json');
}
function monitorSnapshotPath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'monitor-snapshot.json');
}
function leaderAttentionPath(teamName, cwd) {
    return join(teamDir(teamName, cwd), 'leader-attention.json');
}
function normalizeTeamLeaderAttentionState(teamName, raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const parsed = raw;
    const source = parsed.source === 'native_stop'
        ? 'native_stop'
        : parsed.source === 'native_session_end'
            ? 'native_session_end'
            : 'notify_hook';
    const leaderDecisionState = parsed.leader_decision_state === 'done_waiting_on_leader'
        || parsed.leader_decision_state === 'stuck_waiting_on_leader'
        ? parsed.leader_decision_state
        : 'still_actionable';
    const attentionReasons = Array.isArray(parsed.attention_reasons)
        ? parsed.attention_reasons.filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
        : [];
    return {
        team_name: typeof parsed.team_name === 'string' && parsed.team_name.trim() !== '' ? parsed.team_name : teamName,
        updated_at: typeof parsed.updated_at === 'string' && parsed.updated_at.trim() !== '' ? parsed.updated_at : new Date().toISOString(),
        source,
        leader_decision_state: leaderDecisionState,
        leader_attention_pending: parsed.leader_attention_pending === true,
        leader_attention_reason: typeof parsed.leader_attention_reason === 'string' && parsed.leader_attention_reason.trim() !== ''
            ? parsed.leader_attention_reason
            : null,
        attention_reasons: attentionReasons,
        leader_stale: parsed.leader_stale === true,
        leader_session_active: parsed.leader_session_active !== false,
        leader_session_id: typeof parsed.leader_session_id === 'string' && parsed.leader_session_id.trim() !== ''
            ? parsed.leader_session_id
            : null,
        leader_session_stopped_at: typeof parsed.leader_session_stopped_at === 'string' && parsed.leader_session_stopped_at.trim() !== ''
            ? parsed.leader_session_stopped_at
            : null,
        unread_leader_message_count: typeof parsed.unread_leader_message_count === 'number' && Number.isFinite(parsed.unread_leader_message_count)
            ? parsed.unread_leader_message_count
            : 0,
        work_remaining: parsed.work_remaining === true,
        stalled_for_ms: typeof parsed.stalled_for_ms === 'number' && Number.isFinite(parsed.stalled_for_ms)
            ? parsed.stalled_for_ms
            : null,
    };
}
export async function readMonitorSnapshot(teamName, cwd) {
    return await readMonitorSnapshotImpl(teamName, cwd, monitorSnapshotPath);
}
export async function writeMonitorSnapshot(teamName, snapshot, cwd) {
    await writeMonitorSnapshotImpl(teamName, snapshot, cwd, monitorSnapshotPath, writeAtomic);
}
export async function readTeamPhase(teamName, cwd) {
    const phase = await readTeamPhaseImpl(teamName, cwd, teamPhasePath);
    return phase;
}
export async function writeTeamPhase(teamName, phaseState, cwd) {
    await writeTeamPhaseImpl(teamName, phaseState, cwd, teamPhasePath, writeAtomic);
}
export async function readTeamLeaderAttention(teamName, cwd) {
    const path = leaderAttentionPath(teamName, cwd);
    if (!existsSync(path))
        return null;
    try {
        return normalizeTeamLeaderAttentionState(teamName, JSON.parse(await readFile(path, 'utf-8')));
    }
    catch {
        return null;
    }
}
export async function writeTeamLeaderAttention(teamName, attentionState, cwd) {
    await writeAtomic(leaderAttentionPath(teamName, cwd), JSON.stringify({
        ...attentionState,
        team_name: teamName,
    }, null, 2));
}
async function deriveLeaderStopAttentionState(teamName, cwd, existing) {
    const [config, tasks, snapshot, mailbox] = await Promise.all([
        readTeamConfig(teamName, cwd),
        listTasks(teamName, cwd).catch(() => []),
        readMonitorSnapshot(teamName, cwd),
        listMailboxMessages(teamName, 'leader-fixed', cwd).catch(() => []),
    ]);
    const pendingCount = tasks.filter((task) => task.status === 'pending').length;
    const blockedCount = tasks.filter((task) => task.status === 'blocked').length;
    const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length;
    const workRemaining = pendingCount + blockedCount + inProgressCount > 0;
    const workerNames = config?.workers.map((worker) => worker.name) ?? Object.keys(snapshot?.workerStateByName ?? {});
    const workerStates = workerNames
        .map((workerName) => snapshot?.workerStateByName?.[workerName] ?? '')
        .filter((state) => typeof state === 'string' && state.trim() !== '');
    const allWorkersIdle = workerStates.length > 0
        && workerStates.every((state) => state === 'idle' || state === 'done');
    const leaderDecisionState = pendingCount === 0 && blockedCount === 0 && inProgressCount === 0 && allWorkersIdle
        ? 'done_waiting_on_leader'
        : blockedCount > 0 && pendingCount === 0 && inProgressCount === 0 && allWorkersIdle
            ? 'stuck_waiting_on_leader'
            : existing?.leader_decision_state ?? 'still_actionable';
    const unreadLeaderMessageCount = mailbox.filter((message) => {
        const deliveredAt = typeof message.delivered_at === 'string' ? message.delivered_at.trim() : '';
        return deliveredAt.length === 0;
    }).length;
    const attentionReasons = new Set(existing?.attention_reasons ?? []);
    const leaderAttentionPending = leaderDecisionState !== 'still_actionable'
        || unreadLeaderMessageCount > 0
        || existing?.leader_attention_pending === true;
    if (leaderAttentionPending) {
        attentionReasons.add('leader_session_stopped');
    }
    return {
        leader_decision_state: leaderDecisionState,
        leader_attention_pending: leaderAttentionPending,
        leader_attention_reason: leaderAttentionPending ? (existing?.leader_attention_reason ?? 'leader_session_stopped') : null,
        attention_reasons: [...attentionReasons],
        unread_leader_message_count: unreadLeaderMessageCount,
        work_remaining: workRemaining,
    };
}
export async function markTeamLeaderSessionStopped(teamName, cwd, leaderSessionId, nowIso = new Date().toISOString()) {
    return await markTeamLeaderStopObserved(teamName, cwd, leaderSessionId, nowIso, 'native_session_end');
}
export async function markTeamLeaderStopObserved(teamName, cwd, leaderSessionId, nowIso = new Date().toISOString(), source = 'native_stop') {
    const existing = await readTeamLeaderAttention(teamName, cwd);
    const derived = await deriveLeaderStopAttentionState(teamName, cwd, existing);
    const nextSource = existing?.source === 'native_stop' && source === 'native_session_end'
        ? 'native_stop'
        : source;
    const next = {
        team_name: teamName,
        updated_at: nowIso,
        source: nextSource,
        leader_decision_state: derived.leader_decision_state,
        leader_attention_pending: derived.leader_attention_pending,
        leader_attention_reason: derived.leader_attention_reason,
        attention_reasons: derived.attention_reasons,
        leader_stale: existing?.leader_stale ?? false,
        leader_session_active: false,
        leader_session_id: leaderSessionId || existing?.leader_session_id || null,
        leader_session_stopped_at: nowIso,
        unread_leader_message_count: derived.unread_leader_message_count,
        work_remaining: derived.work_remaining,
        stalled_for_ms: existing?.stalled_for_ms ?? null,
    };
    await writeTeamLeaderAttention(teamName, next, cwd);
    return next;
}
export async function markOwnedTeamsLeaderSessionStopped(cwd, leaderSessionId, nowIso = new Date().toISOString()) {
    return await markOwnedTeamsLeaderStopObserved(cwd, leaderSessionId, nowIso, 'native_session_end');
}
export async function markOwnedTeamsLeaderStopObserved(cwd, leaderSessionId, nowIso = new Date().toISOString(), source = 'native_stop') {
    if (!leaderSessionId.trim())
        return [];
    const teamsRoot = join(omxStateDir(cwd), 'team');
    if (!existsSync(teamsRoot))
        return [];
    const entries = await readdir(teamsRoot, { withFileTypes: true }).catch(() => []);
    const updatedTeams = [];
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const teamName = entry.name.trim();
        if (!teamName)
            continue;
        const [manifest, phase] = await Promise.all([
            readTeamManifestV2(teamName, cwd),
            readTeamPhase(teamName, cwd),
        ]);
        if (!manifest)
            continue;
        if ((manifest.leader?.session_id ?? '').trim() !== leaderSessionId.trim())
            continue;
        if (phase && isTerminalPhase(phase.current_phase))
            continue;
        await markTeamLeaderStopObserved(teamName, cwd, leaderSessionId, nowIso, source);
        updatedTeams.push(teamName);
    }
    return updatedTeams;
}
// === Config persistence (public wrapper) ===
export async function saveTeamConfig(config, cwd) {
    await writeConfig(config, cwd);
}
// Delete team state directory
export async function cleanupTeamState(teamName, cwd) {
    await rm(teamDir(teamName, cwd), { recursive: true, force: true });
}
//# sourceMappingURL=state.js.map