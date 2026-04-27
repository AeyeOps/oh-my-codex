/**
 * CLI entry point for team runtime.
 * Reads JSON config from stdin, runs startTeam/monitorTeam/shutdownTeam,
 * writes structured JSON result to stdout.
 *
 * Spawned by OMX team orchestration entrypoints when a background team run starts.
 */
import type { TeamShutdownSummary } from './runtime.js';
type TeamWorkerProvider = 'codex' | 'claude' | 'gemini';
interface TaskResult {
    taskId: string;
    status: string;
    summary: string;
}
interface CliOutput {
    status: 'completed' | 'failed';
    teamName: string;
    taskResults: TaskResult[];
    duration: number;
    workerCount: number;
}
export type TerminalPhaseResult = 'complete' | 'failed' | 'cancelled';
export interface TerminalCliResult {
    output: CliOutput;
    exitCode: number;
    notice: string;
}
export interface LivePaneState {
    paneIds: string[];
    leaderPaneId: string;
}
export declare function loadLivePaneState(teamName: string, cwd: string): Promise<LivePaneState | null>;
export declare function shutdownWithForceFallback(teamName: string, cwd: string): Promise<TeamShutdownSummary>;
export declare function detectDeadWorkerFailure(deadWorkerCount: number, liveWorkerPaneCount: number, hasOutstandingWork: boolean, phase: string): {
    deadWorkerFailure: boolean;
    fixingWithNoWorkers: boolean;
};
export declare function resolveRuntimeCliStateRoot(cwd: string, env?: NodeJS.ProcessEnv): string;
export declare function collectTaskResults(stateRoot: string, teamName: string): TaskResult[];
export declare function buildCliOutput(stateRoot: string, teamName: string, status: 'completed' | 'failed', workerCount: number, startTimeMs: number): CliOutput;
export declare function buildTerminalCliResult(stateRoot: string, teamName: string, phase: TerminalPhaseResult, workerCount: number, startTimeMs: number): TerminalCliResult;
export declare function normalizeAgentTypes(raw: string[], workerCount: number): TeamWorkerProvider[];
export {};
//# sourceMappingURL=runtime-cli.d.ts.map