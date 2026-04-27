import type { QuestionAnswer, QuestionInput, QuestionRecord, QuestionRendererState, QuestionStatus } from './types.js';
export declare function getQuestionStateDir(cwd: string, sessionId?: string): string;
export declare function getQuestionRecordPath(cwd: string, questionId: string, sessionId?: string): string;
export declare function writeQuestionRecord(recordPath: string, record: QuestionRecord): Promise<void>;
export declare function readQuestionRecord(recordPath: string): Promise<QuestionRecord | null>;
export declare function createQuestionRecord(cwd: string, input: QuestionInput, sessionId?: string, now?: Date): Promise<{
    recordPath: string;
    record: QuestionRecord;
}>;
export declare function updateQuestionRecord(recordPath: string, updater: (record: QuestionRecord) => QuestionRecord): Promise<QuestionRecord>;
export declare function markQuestionPrompting(recordPath: string, renderer: QuestionRendererState): Promise<QuestionRecord>;
export declare function markQuestionAnswered(recordPath: string, answer: QuestionAnswer): Promise<QuestionRecord>;
export declare function markQuestionTerminalError(recordPath: string, status: Extract<QuestionStatus, 'aborted' | 'error'>, code: string, message: string): Promise<QuestionRecord>;
export declare function isTerminalQuestionStatus(status: QuestionStatus): boolean;
export declare function waitForQuestionTerminalState(recordPath: string, options?: {
    pollIntervalMs?: number;
    timeoutMs?: number;
    rendererAlive?: (record: QuestionRecord) => boolean;
    rendererDeathMessage?: (record: QuestionRecord) => string;
}): Promise<QuestionRecord>;
//# sourceMappingURL=state.d.ts.map