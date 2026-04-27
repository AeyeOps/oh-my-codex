export declare function resolveDispatchLockTimeoutMs(env?: NodeJS.ProcessEnv): number;
export declare function withDispatchLock<T>(teamName: string, cwd: string, teamDir: (teamName: string, cwd: string) => string, dispatchLockDir: (teamName: string, cwd: string) => string, fn: () => Promise<T>): Promise<T>;
//# sourceMappingURL=dispatch-lock.d.ts.map