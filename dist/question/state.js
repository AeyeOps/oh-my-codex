import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { getStateDir } from '../mcp/state-paths.js';
import { writeAtomic } from '../team/state.js';
import { sleep } from '../utils/sleep.js';
import { getNormalizedQuestionType } from './types.js';
const QUESTION_NAMESPACE = 'questions';
const DEFAULT_POLL_INTERVAL_MS = 100;
function buildQuestionId(now = new Date()) {
    return `question-${now.toISOString().replace(/[:.]/g, '-')}-$${Math.random().toString(16).slice(2, 10)}`.replace('$', '');
}
export function getQuestionStateDir(cwd, sessionId) {
    return join(getStateDir(cwd, sessionId), QUESTION_NAMESPACE);
}
export function getQuestionRecordPath(cwd, questionId, sessionId) {
    return join(getQuestionStateDir(cwd, sessionId), `${questionId}.json`);
}
export async function writeQuestionRecord(recordPath, record) {
    await mkdir(dirname(recordPath), { recursive: true });
    await writeAtomic(recordPath, `${JSON.stringify(record, null, 2)}\n`);
}
export async function readQuestionRecord(recordPath) {
    if (!existsSync(recordPath))
        return null;
    const parsed = JSON.parse(await readFile(recordPath, 'utf-8'));
    return parsed;
}
export async function createQuestionRecord(cwd, input, sessionId, now = new Date()) {
    const questionId = buildQuestionId(now);
    const nowIso = now.toISOString();
    const record = {
        kind: 'omx.question/v1',
        question_id: questionId,
        ...(sessionId ? { session_id: sessionId } : {}),
        created_at: nowIso,
        updated_at: nowIso,
        status: 'pending',
        ...(input.header ? { header: input.header } : {}),
        question: input.question,
        options: input.options,
        allow_other: input.allow_other,
        other_label: input.other_label,
        multi_select: input.multi_select,
        type: getNormalizedQuestionType(input),
        ...(input.source ? { source: input.source } : {}),
    };
    const recordPath = getQuestionRecordPath(cwd, questionId, sessionId);
    await writeQuestionRecord(recordPath, record);
    return { recordPath, record };
}
export async function updateQuestionRecord(recordPath, updater) {
    const current = await readQuestionRecord(recordPath);
    if (!current)
        throw new Error(`Question record not found: ${recordPath}`);
    const updated = updater(current);
    await writeQuestionRecord(recordPath, updated);
    return updated;
}
export async function markQuestionPrompting(recordPath, renderer) {
    return updateQuestionRecord(recordPath, (record) => ({
        ...record,
        status: isTerminalQuestionStatus(record.status) ? record.status : 'prompting',
        updated_at: new Date().toISOString(),
        renderer,
    }));
}
export async function markQuestionAnswered(recordPath, answer) {
    return updateQuestionRecord(recordPath, (record) => ({
        ...record,
        status: 'answered',
        updated_at: new Date().toISOString(),
        answer,
        error: undefined,
    }));
}
export async function markQuestionTerminalError(recordPath, status, code, message) {
    return updateQuestionRecord(recordPath, (record) => ({
        ...record,
        status,
        updated_at: new Date().toISOString(),
        error: {
            code,
            message,
            at: new Date().toISOString(),
        },
    }));
}
export function isTerminalQuestionStatus(status) {
    return status === 'answered' || status === 'aborted' || status === 'error';
}
export async function waitForQuestionTerminalState(recordPath, options = {}) {
    const pollIntervalMs = Math.max(10, options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
    const timeoutMs = options.timeoutMs;
    const startedAt = Date.now();
    while (true) {
        const record = await readQuestionRecord(recordPath);
        if (!record)
            throw new Error(`Question record not found while waiting: ${recordPath}`);
        if (isTerminalQuestionStatus(record.status))
            return record;
        if (options.rendererAlive && !options.rendererAlive(record)) {
            throw new Error(options.rendererDeathMessage?.(record)
                ?? `Question renderer ${record.renderer?.renderer ?? 'unknown'} exited before answering.`);
        }
        if (typeof timeoutMs === 'number' && timeoutMs >= 0 && Date.now() - startedAt > timeoutMs) {
            throw new Error(`Timed out waiting for question answer after ${timeoutMs}ms`);
        }
        await sleep(pollIntervalMs);
    }
}
//# sourceMappingURL=state.js.map