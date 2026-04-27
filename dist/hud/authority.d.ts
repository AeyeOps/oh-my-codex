export interface RunHudAuthorityTickOptions {
    cwd: string;
    nodePath?: string;
    packageRoot?: string;
    pollMs?: number;
    timeoutMs?: number;
    env?: NodeJS.ProcessEnv;
}
export interface RunHudAuthorityTickDeps {
    runProcess?: (nodePath: string, args: string[], options: {
        cwd: string;
        env: NodeJS.ProcessEnv;
        timeoutMs: number;
    }) => Promise<void> | void;
}
export declare function runHudAuthorityTick(options: RunHudAuthorityTickOptions, deps?: RunHudAuthorityTickDeps): Promise<void>;
//# sourceMappingURL=authority.d.ts.map