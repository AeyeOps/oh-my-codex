import type { QuestionAnswer, QuestionInput } from './types.js';
export interface OmxQuestionSuccessPayload {
    ok: true;
    question_id: string;
    session_id?: string;
    prompt: QuestionInput;
    answer: QuestionAnswer;
}
export interface OmxQuestionErrorPayload {
    ok: false;
    question_id?: string;
    session_id?: string;
    error: {
        code: string;
        message: string;
    };
}
export type OmxQuestionPayload = OmxQuestionSuccessPayload | OmxQuestionErrorPayload;
export interface OmxQuestionClientOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    argv1?: string | null;
    runner?: OmxQuestionProcessRunner;
}
export interface OmxQuestionProcessResult {
    code: number | null;
    stdout: string;
    stderr: string;
}
export type OmxQuestionProcessRunner = (command: string, args: string[], options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
}) => Promise<OmxQuestionProcessResult>;
export declare class OmxQuestionError extends Error {
    readonly code: string;
    readonly payload?: OmxQuestionErrorPayload;
    readonly stdout: string;
    readonly stderr: string;
    readonly exitCode: number | null;
    constructor(code: string, message: string, options?: {
        payload?: OmxQuestionErrorPayload;
        stdout?: string;
        stderr?: string;
        exitCode?: number | null;
    });
}
export declare function defaultOmxQuestionProcessRunner(command: string, args: string[], options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
}): Promise<OmxQuestionProcessResult>;
export declare function runOmxQuestion(input: Partial<QuestionInput> & {
    question: string;
}, options?: OmxQuestionClientOptions): Promise<OmxQuestionSuccessPayload>;
//# sourceMappingURL=client.d.ts.map