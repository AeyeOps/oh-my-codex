interface TeamPathDeps {
    teamDir: (teamName: string, cwd: string) => string;
    taskClaimLockDir: (teamName: string, taskId: string, cwd: string) => string;
    mailboxLockDir: (teamName: string, workerName: string, cwd: string) => string;
}
export declare function withScalingLock<T>(teamName: string, cwd: string, lockStaleMs: number, deps: TeamPathDeps, fn: () => Promise<T>): Promise<T>;
export declare function withTeamLock<T>(teamName: string, cwd: string, lockStaleMs: number, deps: TeamPathDeps, fn: () => Promise<T>): Promise<T>;
export declare function withTaskClaimLock<T>(teamName: string, taskId: string, cwd: string, lockStaleMs: number, deps: TeamPathDeps, fn: () => Promise<T>): Promise<{
    ok: true;
    value: T;
} | {
    ok: false;
}>;
export declare function withMailboxLock<T>(teamName: string, workerName: string, cwd: string, lockStaleMs: number, deps: TeamPathDeps, fn: () => Promise<T>): Promise<T>;
export {};
//# sourceMappingURL=locks.d.ts.map