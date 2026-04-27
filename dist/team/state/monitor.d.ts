import { type TeamWorkerIntegrationStatus } from '../contracts.js';
export interface TeamSummary {
    teamName: string;
    workerCount: number;
    tasks: {
        total: number;
        pending: number;
        blocked: number;
        in_progress: number;
        completed: number;
        failed: number;
    };
    workers: Array<{
        name: string;
        alive: boolean;
        lastTurnAt: string | null;
        turnsWithoutProgress: number;
    }>;
    nonReportingWorkers: string[];
    performance?: TeamSummaryPerformance;
}
export interface TeamSummaryPerformance {
    total_ms: number;
    tasks_loaded_ms: number;
    workers_polled_ms: number;
    task_count: number;
    worker_count: number;
}
interface TeamSummarySnapshot {
    workerTurnCountByName: Record<string, number>;
    workerTaskByName: Record<string, string>;
}
export interface TeamWorkerIntegrationState {
    last_seen_head?: string;
    last_integrated_head?: string;
    last_leader_head?: string;
    last_rebased_leader_head?: string;
    status?: TeamWorkerIntegrationStatus;
    conflict_commit?: string;
    conflict_files?: string[];
    updated_at?: string;
}
export interface TeamMonitorSnapshotState {
    taskStatusById: Record<string, string>;
    workerAliveByName: Record<string, boolean>;
    workerStateByName: Record<string, string>;
    workerTurnCountByName: Record<string, number>;
    workerTaskIdByName: Record<string, string>;
    mailboxNotifiedByMessageId: Record<string, string>;
    completedEventTaskIds: Record<string, boolean>;
    integrationByWorker?: Record<string, TeamWorkerIntegrationState>;
    monitorTimings?: {
        list_tasks_ms: number;
        worker_scan_ms: number;
        mailbox_delivery_ms: number;
        total_ms: number;
        updated_at: string;
    };
}
export interface TeamPhaseState {
    current_phase: string;
    max_fix_attempts: number;
    current_fix_attempt: number;
    transitions: Array<{
        from: string;
        to: string;
        at: string;
        reason?: string;
    }>;
    updated_at: string;
}
interface MonitorDeps {
    teamName: string;
    cwd: string;
    readTeamConfig: (teamName: string, cwd: string) => Promise<{
        name: string;
        worker_count: number;
        workers: Array<{
            name: string;
        }>;
    } | null>;
    listTasks: (teamName: string, cwd: string) => Promise<Array<{
        id: string;
        status: string;
    }>>;
    readWorkerHeartbeat: (teamName: string, workerName: string, cwd: string) => Promise<{
        alive: boolean;
        last_turn_at: string;
        turn_count: number;
    } | null>;
    readWorkerStatus: (teamName: string, workerName: string, cwd: string) => Promise<{
        state: string;
        current_task_id?: string;
    }>;
    summarySnapshotPath: (teamName: string, cwd: string) => string;
    monitorSnapshotPath: (teamName: string, cwd: string) => string;
    teamPhasePath: (teamName: string, cwd: string) => string;
    writeAtomic: (filePath: string, data: string) => Promise<void>;
}
export declare function readSummarySnapshot(teamName: string, cwd: string, summarySnapshotPath: MonitorDeps['summarySnapshotPath']): Promise<TeamSummarySnapshot | null>;
export declare function writeSummarySnapshot(teamName: string, snapshot: TeamSummarySnapshot, cwd: string, summarySnapshotPath: MonitorDeps['summarySnapshotPath'], writeAtomic: MonitorDeps['writeAtomic']): Promise<void>;
export declare function getTeamSummary(deps: MonitorDeps): Promise<TeamSummary | null>;
export declare function readMonitorSnapshot(teamName: string, cwd: string, monitorSnapshotPath: MonitorDeps['monitorSnapshotPath']): Promise<TeamMonitorSnapshotState | null>;
export declare function writeMonitorSnapshot(teamName: string, snapshot: TeamMonitorSnapshotState, cwd: string, monitorSnapshotPath: MonitorDeps['monitorSnapshotPath'], writeAtomic: MonitorDeps['writeAtomic']): Promise<void>;
export declare function readTeamPhase(teamName: string, cwd: string, teamPhasePath: MonitorDeps['teamPhasePath']): Promise<TeamPhaseState | null>;
export declare function writeTeamPhase(teamName: string, phaseState: TeamPhaseState, cwd: string, teamPhasePath: MonitorDeps['teamPhasePath'], writeAtomic: MonitorDeps['writeAtomic']): Promise<void>;
export {};
//# sourceMappingURL=monitor.d.ts.map