/**
 * Update orchestration for oh-my-codex.
 *
 * AeyeOps fork policy disables the built-in public-npm update path.
 * The launch-time checker and explicit `omx update` command now return
 * fork-managed update guidance instead of checking or installing npm latest.
 */
import { spawnSync } from 'child_process';
export interface UpdateState {
    last_checked_at: string;
    last_seen_latest?: string;
}
export interface UserInstallStamp {
    installed_version: string;
    setup_completed_version?: string;
    updated_at: string;
}
export interface UpdateExecutionResult {
    status: 'updated' | 'up-to-date' | 'declined' | 'failed' | 'unavailable' | 'disabled';
    currentVersion: string | null;
    latestVersion: string | null;
}
type RunGlobalUpdateResult = {
    ok: boolean;
    stderr: string;
};
type RunSetupRefreshResult = {
    ok: boolean;
    stderr: string;
};
type SpawnSyncLike = typeof spawnSync;
export declare const FORK_UPDATE_GUIDANCE_LINES: string[];
export declare function isNewerVersion(current: string, latest: string): boolean;
export declare function shouldCheckForUpdates(nowMs: number, state: UpdateState | null, intervalMs?: number): boolean;
declare function writeUpdateState(cwd: string, state: UpdateState): Promise<void>;
declare function fetchLatestVersion(timeoutMs?: number): Promise<string | null>;
declare function getCurrentVersion(): Promise<string | null>;
declare function runGlobalUpdate(): RunGlobalUpdateResult;
declare function askYesNo(question: string): Promise<boolean>;
interface UpdateDependencies {
    askYesNo: typeof askYesNo;
    fetchLatestVersion: typeof fetchLatestVersion;
    getCurrentVersion: typeof getCurrentVersion;
    readUserInstallStamp: typeof readUserInstallStamp;
    runGlobalUpdate: typeof runGlobalUpdate;
    runSetupRefresh: (cwd: string) => Promise<RunSetupRefreshResult>;
    writeUpdateState: typeof writeUpdateState;
}
export declare function readUserInstallStamp(path?: string): Promise<UserInstallStamp | null>;
export declare function writeUserInstallStamp(stamp: UserInstallStamp, path?: string): Promise<void>;
export declare function isInstallVersionBump(currentVersion: string | null | undefined, stamp: UserInstallStamp | null): boolean;
export declare function resolveInstalledCliEntry(globalInstallRoot: string): Promise<string | null>;
export declare function spawnInstalledSetupRefresh(cliEntry: string, cwd: string, spawnProcess?: SpawnSyncLike): RunSetupRefreshResult;
export declare function runImmediateUpdate(cwd?: string, dependencies?: Partial<UpdateDependencies>): Promise<UpdateExecutionResult>;
export declare function maybeCheckAndPromptUpdate(cwd: string, dependencies?: Partial<UpdateDependencies>): Promise<void>;
export {};
//# sourceMappingURL=update.d.ts.map