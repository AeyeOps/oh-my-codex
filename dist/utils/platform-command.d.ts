import { spawnSync, type SpawnSyncOptionsWithStringEncoding, type SpawnSyncReturns } from 'child_process';
type ExistsSyncLike = (path: string) => boolean;
type SpawnSyncLike = typeof spawnSync;
export type SpawnErrorKind = 'missing' | 'blocked' | 'error';
export interface PlatformCommandSpec {
    command: string;
    args: string[];
    resolvedPath?: string;
}
export interface ProbedPlatformCommand {
    spec: PlatformCommandSpec;
    result: SpawnSyncReturns<string>;
}
export declare function classifySpawnError(error: NodeJS.ErrnoException | undefined | null): SpawnErrorKind | null;
export declare function resolveCommandPathForPlatform(command: string, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, existsImpl?: ExistsSyncLike): string | null;
export declare function resolveTmuxBinaryForPlatform(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, existsImpl?: ExistsSyncLike): string | null;
export declare function buildPlatformCommandSpec(command: string, args: string[], platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, existsImpl?: ExistsSyncLike): PlatformCommandSpec;
export declare function spawnPlatformCommandSync(command: string, args: string[], options?: SpawnSyncOptionsWithStringEncoding, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, existsImpl?: ExistsSyncLike, spawnImpl?: SpawnSyncLike): ProbedPlatformCommand;
export {};
//# sourceMappingURL=platform-command.d.ts.map