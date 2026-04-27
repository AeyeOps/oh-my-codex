import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
export function hookLogPath(cwd, timestamp = new Date()) {
    const date = timestamp.toISOString().slice(0, 10);
    return join(cwd, '.omx', 'logs', `hooks-${date}.jsonl`);
}
export async function appendHookPluginLog(cwd, entry) {
    const path = hookLogPath(cwd, entry.timestamp ? new Date(entry.timestamp) : new Date());
    await mkdir(join(cwd, '.omx', 'logs'), { recursive: true });
    const payload = {
        timestamp: entry.timestamp || new Date().toISOString(),
        ...entry,
    };
    await appendFile(path, JSON.stringify(payload) + '\n').catch((error) => {
        console.warn('[omx] warning: failed to append hook plugin log entry', {
            path,
            error: error instanceof Error ? error.message : String(error),
        });
    });
}
//# sourceMappingURL=logging.js.map