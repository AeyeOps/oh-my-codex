import { type ExecFileSyncOptionsWithStringEncoding } from 'child_process';
export interface ProcessEntry {
    pid: number;
    ppid: number;
    command: string;
}
export interface CleanupCandidate extends ProcessEntry {
    reason: 'ppid=1' | 'outside-current-session';
}
export interface CleanupResult {
    dryRun: boolean;
    candidates: CleanupCandidate[];
    terminatedCount: number;
    forceKilledCount: number;
    failedPids: number[];
}
export interface CleanupDependencies {
    currentPid?: number;
    listProcesses?: () => ProcessEntry[];
    selectCandidates?: (processes: readonly ProcessEntry[], currentPid: number) => CleanupCandidate[];
    isPidAlive?: (pid: number) => boolean;
    sendSignal?: (pid: number, signal: NodeJS.Signals) => void;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    writeLine?: (line: string) => void;
}
interface TmpDirectoryEntry {
    name: string;
    isDirectory(): boolean;
}
export interface TmpCleanupDependencies {
    tmpRoot?: string;
    listTmpEntries?: (tmpRoot: string) => Promise<TmpDirectoryEntry[]>;
    statPath?: (path: string) => Promise<{
        mtimeMs: number;
    }>;
    removePath?: (path: string) => Promise<void>;
    now?: () => number;
    writeLine?: (line: string) => void;
}
export interface CleanupCommandDependencies {
    cleanupProcesses?: (args: readonly string[]) => Promise<CleanupResult>;
    cleanupTmpDirectories?: (args: readonly string[]) => Promise<number>;
}
type ProcessListCommandRunner = (file: string, args: readonly string[], options: ExecFileSyncOptionsWithStringEncoding) => string;
export declare function isOmxMcpProcess(command: string): boolean;
export declare function parsePsOutput(output: string): ProcessEntry[];
export declare function listOmxProcesses(runCommand?: ProcessListCommandRunner): ProcessEntry[];
export declare function buildProtectedPidSet(processes: readonly ProcessEntry[], currentPid: number): Set<number>;
export declare function findCleanupCandidates(processes: readonly ProcessEntry[], currentPid: number): CleanupCandidate[];
export declare function findLaunchSafeCleanupCandidates(processes: readonly ProcessEntry[], currentPid: number): CleanupCandidate[];
export declare function cleanupOmxMcpProcesses(args: readonly string[], dependencies?: CleanupDependencies): Promise<CleanupResult>;
export declare function cleanupStaleTmpDirectories(args: readonly string[], dependencies?: TmpCleanupDependencies): Promise<number>;
export declare function cleanupCommand(args: string[], dependencies?: CleanupCommandDependencies): Promise<void>;
export {};
//# sourceMappingURL=cleanup.d.ts.map