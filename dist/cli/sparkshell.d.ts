import { spawnSync, type SpawnSyncReturns } from 'child_process';
export declare const SPARKSHELL_USAGE: string;
export interface ResolveSparkShellBinaryPathOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    packageRoot?: string;
    platform?: NodeJS.Platform;
    arch?: string;
    linuxLibcPreference?: readonly ('musl' | 'glibc')[];
    exists?: (path: string) => boolean;
}
export interface RunSparkShellBinaryOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    spawnImpl?: typeof spawnSync;
}
export declare function sparkshellBinaryName(platform?: NodeJS.Platform): string;
export declare function packagedSparkShellBinaryPath(packageRoot?: string, platform?: NodeJS.Platform, arch?: string, libc?: 'musl' | 'glibc'): string;
export declare function packagedSparkShellBinaryCandidatePaths(packageRoot?: string, platform?: NodeJS.Platform, arch?: string, env?: NodeJS.ProcessEnv, linuxLibcPreference?: readonly ('musl' | 'glibc')[]): string[];
export declare function repoLocalSparkShellBinaryPath(packageRoot?: string, platform?: NodeJS.Platform): string;
export declare function nestedRepoLocalSparkShellBinaryPath(packageRoot?: string, platform?: NodeJS.Platform): string;
export declare function resolveSparkShellBinaryPath(options?: ResolveSparkShellBinaryPathOptions): string;
export declare function resolveSparkShellBinaryPathWithHydration(options?: ResolveSparkShellBinaryPathOptions): Promise<string>;
export declare function runSparkShellBinary(binaryPath: string, args: readonly string[], options?: RunSparkShellBinaryOptions): SpawnSyncReturns<string>;
export declare function isSparkShellNativeCompatibilityFailure(result: SpawnSyncReturns<string>): boolean;
interface SparkShellFallbackInvocation {
    argv: string[];
    kind: 'command' | 'tmux-pane';
}
export declare function parseSparkShellFallbackInvocation(args: readonly string[]): SparkShellFallbackInvocation;
export declare function sparkshellCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=sparkshell.d.ts.map