import { rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
export declare const REQUIRED_NODE_MODULE_MARKERS: string[];
export declare function hasUsableNodeModules(repoRoot: string): boolean;
export declare function resolveGitCommonDir(cwd: string, gitRunner?: typeof spawnSync): string | null;
export declare function resolveReusableNodeModulesSource(repoRoot: string, gitRunner?: typeof spawnSync): string | null;
export interface EnsureReusableNodeModulesOptions {
    gitRunner?: typeof spawnSync;
    remove?: typeof rmSync;
    symlink?: typeof symlinkSync;
    platformName?: string;
}
export interface EnsureReusableNodeModulesResult {
    strategy: 'existing' | 'symlink' | 'missing';
    nodeModulesPath: string;
    sourceNodeModulesPath?: string;
    warning?: string;
}
export declare function ensureReusableNodeModules(repoRoot: string, options?: EnsureReusableNodeModulesOptions): EnsureReusableNodeModulesResult;
//# sourceMappingURL=repo-deps.d.ts.map