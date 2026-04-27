/**
 * Structured event logging for notify-hook modules.
 */
import { appendFile } from 'fs/promises';
import { join } from 'path';
async function safeAppend(file, line) {
    try {
        await appendFile(file, line);
    }
    catch {
        // Fall through — log writes should never crash the caller
    }
}
export async function logTmuxHookEvent(logsDir, event) {
    const file = join(logsDir, `tmux-hook-${new Date().toISOString().split('T')[0]}.jsonl`);
    await safeAppend(file, JSON.stringify(event) + '\n');
}
export async function logNotifyHookEvent(logsDir, event) {
    const file = join(logsDir, `notify-hook-${new Date().toISOString().split('T')[0]}.jsonl`);
    await safeAppend(file, JSON.stringify(event) + '\n');
}
//# sourceMappingURL=log.js.map