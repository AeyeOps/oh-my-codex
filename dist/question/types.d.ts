export interface QuestionOption {
    label: string;
    value: string;
    description?: string;
}
export type QuestionType = 'single-answerable' | 'multi-answerable';
export interface QuestionInput {
    header?: string;
    question: string;
    options: QuestionOption[];
    allow_other: boolean;
    other_label: string;
    multi_select: boolean;
    type?: QuestionType;
    source?: string;
    session_id?: string;
}
export type QuestionRendererKind = 'tmux-pane' | 'tmux-session' | 'inline-tty' | 'windows-console';
export interface QuestionAnswer {
    kind: 'option' | 'other' | 'multi';
    value: string | string[];
    selected_labels: string[];
    selected_values: string[];
    other_text?: string;
}
export type QuestionStatus = 'pending' | 'prompting' | 'answered' | 'aborted' | 'error';
export interface QuestionRendererState {
    renderer: QuestionRendererKind;
    target: string;
    launched_at: string;
    return_target?: string;
    return_transport?: 'tmux-send-keys';
    pid?: number;
}
export interface QuestionRecord {
    kind: 'omx.question/v1';
    question_id: string;
    session_id?: string;
    created_at: string;
    updated_at: string;
    status: QuestionStatus;
    header?: string;
    question: string;
    options: QuestionOption[];
    allow_other: boolean;
    other_label: string;
    multi_select: boolean;
    type?: QuestionType;
    source?: string;
    renderer?: QuestionRendererState;
    answer?: QuestionAnswer;
    error?: {
        code: string;
        message: string;
        at: string;
    };
}
export declare function getNormalizedQuestionType(input: {
    type?: QuestionType;
    multi_select?: boolean;
}): QuestionType;
export declare function isMultiAnswerableQuestion(input: {
    type?: QuestionType;
    multi_select?: boolean;
}): boolean;
export declare function normalizeQuestionInput(raw: unknown): QuestionInput;
//# sourceMappingURL=types.d.ts.map