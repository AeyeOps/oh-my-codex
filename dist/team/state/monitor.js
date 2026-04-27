import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { performance } from 'perf_hooks';
import { isTeamWorkerIntegrationStatus } from '../contracts.js';
function normalizeWorkerIntegrationState(value) {
    if (!value || typeof value !== 'object')
        return null;
    const raw = value;
    return {
        last_seen_head: typeof raw.last_seen_head === 'string' && raw.last_seen_head !== '' ? raw.last_seen_head : undefined,
        last_integrated_head: typeof raw.last_integrated_head === 'string' && raw.last_integrated_head !== '' ? raw.last_integrated_head : undefined,
        last_leader_head: typeof raw.last_leader_head === 'string' && raw.last_leader_head !== '' ? raw.last_leader_head : undefined,
        last_rebased_leader_head: typeof raw.last_rebased_leader_head === 'string' && raw.last_rebased_leader_head !== '' ? raw.last_rebased_leader_head : undefined,
        status: isTeamWorkerIntegrationStatus(raw.status) ? raw.status : undefined,
        conflict_commit: typeof raw.conflict_commit === 'string' && raw.conflict_commit !== '' ? raw.conflict_commit : undefined,
        conflict_files: Array.isArray(raw.conflict_files)
            ? raw.conflict_files.filter((entry) => typeof entry === 'string' && entry !== '')
            : undefined,
        updated_at: typeof raw.updated_at === 'string' && raw.updated_at !== '' ? raw.updated_at : undefined,
    };
}
function normalizeIntegrationByWorker(value) {
    if (!value || typeof value !== 'object')
        return {};
    const entries = Object.entries(value)
        .map(([workerName, state]) => {
        const normalized = normalizeWorkerIntegrationState(state);
        return normalized ? [workerName, normalized] : null;
    })
        .filter((entry) => entry !== null);
    return Object.fromEntries(entries);
}
export async function readSummarySnapshot(teamName, cwd, summarySnapshotPath) {
    const p = summarySnapshotPath(teamName, cwd);
    if (!existsSync(p))
        return null;
    try {
        const raw = await readFile(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        return {
            workerTurnCountByName: parsed.workerTurnCountByName ?? {},
            workerTaskByName: parsed.workerTaskByName ?? {},
        };
    }
    catch {
        return null;
    }
}
export async function writeSummarySnapshot(teamName, snapshot, cwd, summarySnapshotPath, writeAtomic) {
    await writeAtomic(summarySnapshotPath(teamName, cwd), JSON.stringify(snapshot, null, 2));
}
export async function getTeamSummary(deps) {
    const summaryStartMs = performance.now();
    const cfg = await deps.readTeamConfig(deps.teamName, deps.cwd);
    if (!cfg)
        return null;
    const tasksStartMs = performance.now();
    const tasks = await deps.listTasks(deps.teamName, deps.cwd);
    const tasksLoadedMs = performance.now() - tasksStartMs;
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const previousSnapshot = await readSummarySnapshot(deps.teamName, deps.cwd, deps.summarySnapshotPath);
    const counts = { total: tasks.length, pending: 0, blocked: 0, in_progress: 0, completed: 0, failed: 0 };
    for (const t of tasks) {
        if (t.status === 'pending')
            counts.pending++;
        else if (t.status === 'blocked')
            counts.blocked++;
        else if (t.status === 'in_progress')
            counts.in_progress++;
        else if (t.status === 'completed')
            counts.completed++;
        else if (t.status === 'failed')
            counts.failed++;
    }
    const workers = cfg.workers || [];
    const workerSummaries = [];
    const nonReportingWorkers = [];
    const nextSnapshot = { workerTurnCountByName: {}, workerTaskByName: {} };
    const workerPollStartMs = performance.now();
    const workerSignals = await Promise.all(workers.map(async (worker) => {
        const [hb, status] = await Promise.all([
            deps.readWorkerHeartbeat(deps.teamName, worker.name, deps.cwd),
            deps.readWorkerStatus(deps.teamName, worker.name, deps.cwd),
        ]);
        return { worker, hb, status };
    }));
    const workersPolledMs = performance.now() - workerPollStartMs;
    for (const { worker, hb, status } of workerSignals) {
        const alive = hb?.alive ?? false;
        const lastTurnAt = hb?.last_turn_at ?? null;
        const currentTaskId = status.current_task_id ?? '';
        const prevTaskId = previousSnapshot?.workerTaskByName[worker.name] ?? '';
        const prevTurnCount = previousSnapshot?.workerTurnCountByName[worker.name] ?? 0;
        const currentTask = currentTaskId ? taskById.get(currentTaskId) ?? null : null;
        const turnsWithoutProgress = hb &&
            status.state === 'working' &&
            currentTask &&
            (currentTask.status === 'pending' || currentTask.status === 'in_progress') &&
            currentTaskId === prevTaskId
            ? Math.max(0, hb.turn_count - prevTurnCount)
            : 0;
        if (alive && status.state === 'working' && turnsWithoutProgress > 5) {
            nonReportingWorkers.push(worker.name);
        }
        workerSummaries.push({ name: worker.name, alive, lastTurnAt, turnsWithoutProgress });
        nextSnapshot.workerTurnCountByName[worker.name] = hb?.turn_count ?? 0;
        nextSnapshot.workerTaskByName[worker.name] = currentTaskId;
    }
    await writeSummarySnapshot(deps.teamName, nextSnapshot, deps.cwd, deps.summarySnapshotPath, deps.writeAtomic);
    return {
        teamName: cfg.name,
        workerCount: cfg.worker_count,
        tasks: counts,
        workers: workerSummaries,
        nonReportingWorkers,
        performance: {
            total_ms: Number((performance.now() - summaryStartMs).toFixed(2)),
            tasks_loaded_ms: Number(tasksLoadedMs.toFixed(2)),
            workers_polled_ms: Number(workersPolledMs.toFixed(2)),
            task_count: tasks.length,
            worker_count: workers.length,
        },
    };
}
export async function readMonitorSnapshot(teamName, cwd, monitorSnapshotPath) {
    const p = monitorSnapshotPath(teamName, cwd);
    if (!existsSync(p))
        return null;
    try {
        const raw = await readFile(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        const monitorTimings = (() => {
            const candidate = parsed.monitorTimings;
            if (!candidate || typeof candidate !== 'object')
                return undefined;
            if (typeof candidate.list_tasks_ms !== 'number' ||
                typeof candidate.worker_scan_ms !== 'number' ||
                typeof candidate.mailbox_delivery_ms !== 'number' ||
                typeof candidate.total_ms !== 'number' ||
                typeof candidate.updated_at !== 'string') {
                return undefined;
            }
            return candidate;
        })();
        return {
            taskStatusById: parsed.taskStatusById ?? {},
            workerAliveByName: parsed.workerAliveByName ?? {},
            workerStateByName: parsed.workerStateByName ?? {},
            workerTurnCountByName: parsed.workerTurnCountByName ?? {},
            workerTaskIdByName: parsed.workerTaskIdByName ?? {},
            mailboxNotifiedByMessageId: parsed.mailboxNotifiedByMessageId ?? {},
            completedEventTaskIds: parsed.completedEventTaskIds ?? {},
            integrationByWorker: normalizeIntegrationByWorker(parsed.integrationByWorker),
            monitorTimings,
        };
    }
    catch {
        return null;
    }
}
export async function writeMonitorSnapshot(teamName, snapshot, cwd, monitorSnapshotPath, writeAtomic) {
    await writeAtomic(monitorSnapshotPath(teamName, cwd), JSON.stringify(snapshot, null, 2));
}
export async function readTeamPhase(teamName, cwd, teamPhasePath) {
    const p = teamPhasePath(teamName, cwd);
    if (!existsSync(p))
        return null;
    try {
        const raw = await readFile(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        const currentPhase = typeof parsed.current_phase === 'string' ? parsed.current_phase : 'team-exec';
        return {
            current_phase: currentPhase,
            max_fix_attempts: typeof parsed.max_fix_attempts === 'number' ? parsed.max_fix_attempts : 3,
            current_fix_attempt: typeof parsed.current_fix_attempt === 'number' ? parsed.current_fix_attempt : 0,
            transitions: Array.isArray(parsed.transitions) ? parsed.transitions : [],
            updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : new Date().toISOString(),
        };
    }
    catch {
        return null;
    }
}
export async function writeTeamPhase(teamName, phaseState, cwd, teamPhasePath, writeAtomic) {
    await writeAtomic(teamPhasePath(teamName, cwd), JSON.stringify(phaseState, null, 2));
}
//# sourceMappingURL=monitor.js.map