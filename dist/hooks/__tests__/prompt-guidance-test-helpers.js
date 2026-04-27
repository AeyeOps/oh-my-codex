import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../../');
export function loadSurface(path) {
    return readFileSync(join(repoRoot, path), 'utf-8');
}
function isGitTracked(path) {
    if (!existsSync(join(repoRoot, path)))
        return false;
    try {
        execFileSync('git', ['ls-files', '--error-unmatch', path], {
            cwd: repoRoot,
            stdio: 'ignore',
        });
        return true;
    }
    catch {
        return false;
    }
}
export function listTrackedAgentSurfaces() {
    return ['AGENTS.md', 'templates/AGENTS.md'].filter((path) => isGitTracked(path));
}
export function assertContractSurface(contract) {
    const content = loadSurface(contract.path);
    for (const pattern of contract.requiredPatterns) {
        assert.match(content, pattern, `${contract.id} missing required pattern: ${pattern}`);
    }
}
//# sourceMappingURL=prompt-guidance-test-helpers.js.map