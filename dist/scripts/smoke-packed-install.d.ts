import { spawnSync } from 'node:child_process';
export { hasUsableNodeModules, resolveGitCommonDir, resolveReusableNodeModulesSource, } from '../utils/repo-deps.js';
export declare const PACKED_INSTALL_SMOKE_CORE_COMMANDS: readonly [readonly ["--help"], readonly ["version"]];
interface EnsureRepoDepsOptions {
    gitRunner?: typeof spawnSync;
    install?: (cwd: string) => void;
    log?: (message: string) => void;
}
interface EnsureRepoDepsResult {
    strategy: string;
    nodeModulesPath: string;
    sourceNodeModulesPath?: string;
}
export declare function ensureRepoDependencies(repoRoot: string, options?: EnsureRepoDepsOptions): EnsureRepoDepsResult;
export declare function parseNpmPackJsonOutput(stdout: string): Array<{
    filename: string;
}>;
//# sourceMappingURL=smoke-packed-install.d.ts.map