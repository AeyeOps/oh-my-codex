import { existsSync, lstatSync, rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, resolve } from 'node:path';
export const REQUIRED_NODE_MODULE_MARKERS = [
    join('typescript', 'package.json'),
    join('@iarna', 'toml', 'package.json'),
    join('@modelcontextprotocol', 'sdk', 'package.json'),
    join('zod', 'package.json'),
];
function hasNodeModulesPath(nodeModulesPath) {
    try {
        lstatSync(nodeModulesPath);
        return true;
    }
    catch {
        return false;
    }
}
export function hasUsableNodeModules(repoRoot) {
    return REQUIRED_NODE_MODULE_MARKERS.every((marker) => existsSync(join(repoRoot, 'node_modules', marker)));
}
export function resolveGitCommonDir(cwd, gitRunner = spawnSync) {
    const result = gitRunner('git', ['rev-parse', '--git-common-dir'], {
        cwd,
        encoding: 'utf-8',
    });
    if (result.status !== 0) {
        return null;
    }
    const value = (result.stdout || '').trim();
    if (!value) {
        return null;
    }
    return resolve(cwd, value);
}
export function resolveReusableNodeModulesSource(repoRoot, gitRunner = spawnSync) {
    const commonDir = resolveGitCommonDir(repoRoot, gitRunner);
    if (!commonDir || basename(commonDir) !== '.git') {
        return null;
    }
    const primaryRepoRoot = dirname(commonDir);
    if (resolve(primaryRepoRoot) === resolve(repoRoot)) {
        return null;
    }
    if (!hasUsableNodeModules(primaryRepoRoot)) {
        return null;
    }
    return join(primaryRepoRoot, 'node_modules');
}
export function ensureReusableNodeModules(repoRoot, options = {}) {
    const { gitRunner = spawnSync, remove = rmSync, symlink = symlinkSync, platformName = process.platform, } = options;
    const targetNodeModules = join(repoRoot, 'node_modules');
    if (hasUsableNodeModules(repoRoot)) {
        return {
            strategy: 'existing',
            nodeModulesPath: targetNodeModules,
        };
    }
    if (hasNodeModulesPath(targetNodeModules)) {
        remove(targetNodeModules, { recursive: true, force: true });
    }
    const reusableNodeModules = resolveReusableNodeModulesSource(repoRoot, gitRunner);
    if (!reusableNodeModules) {
        return {
            strategy: 'missing',
            nodeModulesPath: targetNodeModules,
            warning: `No reusable parent-repo node_modules was found for worktree ${repoRoot}. `
                + 'Downstream build/test verification may fail until dependencies are bootstrapped manually.',
        };
    }
    symlink(reusableNodeModules, targetNodeModules, platformName === 'win32' ? 'junction' : 'dir');
    return {
        strategy: 'symlink',
        nodeModulesPath: targetNodeModules,
        sourceNodeModulesPath: reusableNodeModules,
    };
}
//# sourceMappingURL=repo-deps.js.map