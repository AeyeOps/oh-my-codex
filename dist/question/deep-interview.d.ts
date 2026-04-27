import { type OmxQuestionClientOptions, type OmxQuestionSuccessPayload } from './client.js';
import type { TerminalLifecycleOutcome } from '../runtime/terminal-lifecycle.js';
import type { QuestionInput } from './types.js';
export interface DeepInterviewQuestionEnforcementState {
    obligation_id: string;
    source: 'omx-question';
    status: 'pending' | 'satisfied' | 'cleared';
    lifecycle_outcome: 'askuserQuestion';
    requested_at: string;
    question_id?: string;
    satisfied_at?: string;
    cleared_at?: string;
    clear_reason?: 'handoff' | 'abort' | 'error';
}
interface DeepInterviewStateRecord {
    updated_at?: string;
    lifecycle_outcome?: TerminalLifecycleOutcome;
    question_enforcement?: DeepInterviewQuestionEnforcementState;
    [key: string]: unknown;
}
export declare function createDeepInterviewQuestionObligation(now?: Date): DeepInterviewQuestionEnforcementState;
export declare function isPendingDeepInterviewQuestionEnforcement(enforcement: Partial<DeepInterviewQuestionEnforcementState> | null | undefined): enforcement is DeepInterviewQuestionEnforcementState;
export declare function satisfyDeepInterviewQuestionObligation(enforcement: DeepInterviewQuestionEnforcementState, questionId: string, now?: Date): DeepInterviewQuestionEnforcementState;
export declare function clearDeepInterviewQuestionObligation(enforcement: DeepInterviewQuestionEnforcementState | undefined, reason: 'handoff' | 'abort' | 'error', now?: Date): DeepInterviewQuestionEnforcementState | undefined;
export declare function updateDeepInterviewQuestionEnforcement(cwd: string, sessionId: string | undefined, updater: (current: DeepInterviewQuestionEnforcementState | undefined) => DeepInterviewQuestionEnforcementState | undefined): Promise<DeepInterviewStateRecord | null>;
export declare function reconcileDeepInterviewQuestionEnforcementFromAnsweredRecords(cwd: string, sessionId: string | undefined, now?: Date): Promise<DeepInterviewStateRecord | null>;
export declare function runDeepInterviewQuestion(input: Partial<QuestionInput> & {
    question: string;
}, options?: OmxQuestionClientOptions): Promise<OmxQuestionSuccessPayload>;
export {};
//# sourceMappingURL=deep-interview.d.ts.map