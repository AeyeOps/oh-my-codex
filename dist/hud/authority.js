import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPackageRoot } from '../utils/package.js';
async function defaultRunProcess(nodePath, args, options) {
    const result = spawnSync(nodePath, args, {
        cwd: options.cwd,
        env: options.env,
        encoding: 'utf-8',
        stdio: 'ignore',
        timeout: options.timeoutMs,
        windowsHide: true,
    });
    if (result.status !== 0) {
        throw new Error((result.stderr || result.stdout || '').trim() || `hud authority tick failed with status ${result.status ?? 'unknown'}`);
    }
}
export async function runHudAuthorityTick(options, deps = {}) {
    const cwd = options.cwd;
    const nodePath = options.nodePath ?? process.execPath;
    const packageRoot = options.packageRoot ?? getPackageRoot();
    const pollMs = Math.max(1, options.pollMs ?? 75);
    const timeoutMs = Math.max(100, options.timeoutMs ?? 5_000);
    const watcherScript = join(packageRoot, 'dist', 'scripts', 'notify-fallback-watcher.js');
    const notifyScript = join(packageRoot, 'dist', 'scripts', 'notify-hook.js');
    const authorityOwnerPath = join(cwd, '.omx', 'state', 'notify-fallback-authority-owner.json');
    const runProcess = deps.runProcess ?? defaultRunProcess;
    await mkdir(join(cwd, '.omx', 'state'), { recursive: true }).catch(() => { });
    await writeFile(authorityOwnerPath, JSON.stringify({
        owner: 'hud',
        pid: process.pid,
        cwd,
        heartbeat_at: new Date().toISOString(),
    }, null, 2)).catch(() => { });
    await runProcess(nodePath, [
        watcherScript,
        '--once',
        '--authority-only',
        '--cwd',
        cwd,
        '--notify-script',
        notifyScript,
        '--poll-ms',
        String(pollMs),
    ], {
        cwd,
        env: {
            ...process.env,
            ...(options.env ?? {}),
            OMX_HUD_AUTHORITY: '1',
        },
        timeoutMs,
    });
}
//# sourceMappingURL=authority.js.map