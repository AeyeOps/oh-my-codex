import type { QuestionAnswer, QuestionRecord } from './types.js';
interface QuestionUiInput {
    isTTY?: boolean;
    on(event: 'keypress', listener: (str: string, key: KeyLike) => void): this;
    off(event: 'keypress', listener: (str: string, key: KeyLike) => void): this;
    resume?(): void;
    pause?(): void;
    setRawMode?(mode: boolean): void;
}
interface QuestionUiOutput {
    isTTY?: boolean;
    write(chunk: string): boolean;
}
interface QuestionUiDeps {
    input?: QuestionUiInput;
    output?: QuestionUiOutput;
    env?: NodeJS.ProcessEnv;
    injectAnswerToPane?: (paneId: string, answer: QuestionAnswer) => boolean;
}
interface InteractiveSelectionState {
    cursorIndex: number;
    selectedIndices: number[];
    error?: string;
}
interface SelectionUpdate {
    state: InteractiveSelectionState;
    submit: boolean;
}
interface KeyLike {
    name?: string;
    ctrl?: boolean;
    sequence?: string;
}
export declare function createInitialInteractiveSelectionState(): InteractiveSelectionState;
export declare function applyInteractiveSelectionKey(record: QuestionRecord, state: InteractiveSelectionState, key: KeyLike): SelectionUpdate;
export declare function renderInteractiveQuestionFrame(record: QuestionRecord, state: InteractiveSelectionState): string;
export declare function promptForSelectionsWithArrows(record: QuestionRecord, deps?: QuestionUiDeps): Promise<number[]>;
export declare function runQuestionUi(recordPath: string, deps?: QuestionUiDeps): Promise<void>;
export {};
//# sourceMappingURL=ui.d.ts.map