import { emitKeypressEvents } from 'node:readline';
import { createInterface as createPromptInterface } from 'node:readline/promises';
import { stdin as defaultInput, stdout as defaultOutput } from 'node:process';
import { injectQuestionAnswerToPane } from './renderer.js';
import { markQuestionAnswered, markQuestionTerminalError, readQuestionRecord } from './state.js';
import { isMultiAnswerableQuestion } from './types.js';
function getOptionLabels(record) {
    const labels = record.options.map((option, index) => `${index + 1}. ${option.label}`);
    if (record.allow_other) {
        labels.push(`${record.options.length + 1}. ${record.other_label}`);
    }
    return labels;
}
function renderOptions(record) {
    return getOptionLabels(record).map((label) => `  [ ] ${label}`);
}
function parseSelection(raw, optionCount, multiSelect) {
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    const parts = multiSelect ? trimmed.split(',') : [trimmed];
    const values = parts
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((value) => Number.isFinite(value));
    if (values.length === 0)
        return null;
    if (!multiSelect && values.length !== 1)
        return null;
    if (values.some((value) => value < 1 || value > optionCount))
        return null;
    return [...new Set(values)];
}
function buildAnswer(record, selections, otherText) {
    const optionCount = record.options.length;
    const otherIndex = optionCount + 1;
    const selectedOptions = selections
        .filter((value) => value <= optionCount)
        .map((value) => record.options[value - 1]);
    const selected_labels = selectedOptions.map((option) => option.label);
    const selected_values = selectedOptions.map((option) => option.value);
    const includesOther = record.allow_other && selections.includes(otherIndex);
    if (isMultiAnswerableQuestion(record)) {
        const values = includesOther && otherText ? [...selected_values, otherText] : selected_values;
        const labels = includesOther && otherText ? [...selected_labels, record.other_label] : selected_labels;
        return {
            kind: 'multi',
            value: values,
            selected_labels: labels,
            selected_values: values,
            ...(includesOther && otherText ? { other_text: otherText } : {}),
        };
    }
    if (includesOther) {
        if (!otherText)
            throw new Error('Other response text is required.');
        return {
            kind: 'other',
            value: otherText,
            selected_labels: [record.other_label],
            selected_values: [otherText],
            other_text: otherText,
        };
    }
    const selected = selectedOptions[0];
    if (!selected)
        throw new Error('No option selected.');
    return {
        kind: 'option',
        value: selected.value,
        selected_labels: [selected.label],
        selected_values: [selected.value],
    };
}
function safeString(value) {
    return typeof value === 'string' ? value : '';
}
function maybeInjectAnswer(record, answer, deps = {}) {
    const env = deps.env ?? process.env;
    const envTransport = safeString(env.OMX_QUESTION_RETURN_TRANSPORT).trim();
    const target = record.renderer?.return_target ?? safeString(env.OMX_QUESTION_RETURN_TARGET).trim();
    const transport = record.renderer?.return_transport ?? (envTransport === 'tmux-send-keys' ? envTransport : undefined);
    if (!target || transport !== 'tmux-send-keys')
        return;
    try {
        (deps.injectAnswerToPane ?? injectQuestionAnswerToPane)(target, answer);
    }
    catch {
        // Best-effort continuation nudge only; stdout return path remains canonical.
    }
}
function supportsInteractiveArrowUi(input, output) {
    return Boolean(input.isTTY && output.isTTY && typeof input.setRawMode === 'function');
}
function toggleSelection(selectedIndices, index) {
    return selectedIndices.includes(index)
        ? selectedIndices.filter((value) => value !== index)
        : [...selectedIndices, index].sort((left, right) => left - right);
}
export function createInitialInteractiveSelectionState() {
    return {
        cursorIndex: 0,
        selectedIndices: [],
    };
}
export function applyInteractiveSelectionKey(record, state, key) {
    const optionCount = getOptionLabels(record).length;
    if (optionCount === 0)
        throw new Error('Interactive question UI requires at least one selectable option.');
    const moveCursor = (delta) => ({
        submit: false,
        state: {
            ...state,
            cursorIndex: (state.cursorIndex + delta + optionCount) % optionCount,
            error: undefined,
        },
    });
    if (key.name === 'up')
        return moveCursor(-1);
    if (key.name === 'down')
        return moveCursor(1);
    if (key.sequence && /^[1-9]$/.test(key.sequence)) {
        const explicitIndex = Number.parseInt(key.sequence, 10) - 1;
        if (explicitIndex < optionCount) {
            return {
                submit: !isMultiAnswerableQuestion(record),
                state: {
                    ...state,
                    cursorIndex: explicitIndex,
                    selectedIndices: isMultiAnswerableQuestion(record) ? toggleSelection(state.selectedIndices, explicitIndex) : state.selectedIndices,
                    error: undefined,
                },
            };
        }
    }
    if (key.name === 'space') {
        if (!isMultiAnswerableQuestion(record)) {
            return {
                submit: true,
                state: {
                    ...state,
                    error: undefined,
                },
            };
        }
        return {
            submit: false,
            state: {
                ...state,
                selectedIndices: toggleSelection(state.selectedIndices, state.cursorIndex),
                error: undefined,
            },
        };
    }
    if (key.name === 'return' || key.name === 'enter') {
        if (!isMultiAnswerableQuestion(record)) {
            return {
                submit: true,
                state: {
                    ...state,
                    error: undefined,
                },
            };
        }
        if (state.selectedIndices.length > 0) {
            return {
                submit: true,
                state: {
                    ...state,
                    error: undefined,
                },
            };
        }
        return {
            submit: false,
            state: {
                ...state,
                error: 'Select one or more options with Space before pressing Enter.',
            },
        };
    }
    return { submit: false, state };
}
export function renderInteractiveQuestionFrame(record, state) {
    const optionLabels = getOptionLabels(record);
    const lines = [];
    if (record.header)
        lines.push(record.header);
    lines.push(record.question, '');
    optionLabels.forEach((label, index) => {
        const isActive = state.cursorIndex === index;
        const isChecked = isMultiAnswerableQuestion(record) ? state.selectedIndices.includes(index) : isActive;
        lines.push(`${isActive ? '›' : ' '} [${isChecked ? 'x' : ' '}] ${label}`);
    });
    lines.push('');
    lines.push(isMultiAnswerableQuestion(record)
        ? 'Use ↑/↓ to move, Space to toggle, Enter to submit.'
        : 'Use ↑/↓ to move, Enter to select.');
    if (state.error)
        lines.push(state.error);
    return `${lines.join('\n')}\n`;
}
export async function promptForSelectionsWithArrows(record, deps = {}) {
    const input = deps.input ?? defaultInput;
    const output = deps.output ?? defaultOutput;
    if (!supportsInteractiveArrowUi(input, output)) {
        throw new Error('Interactive arrow UI requires TTY stdin/stdout with raw-mode support.');
    }
    return new Promise((resolve, reject) => {
        let state = createInitialInteractiveSelectionState();
        let finished = false;
        const cleanup = () => {
            input.off('keypress', onKeypress);
            input.setRawMode?.(false);
            input.pause?.();
            output.write('\u001b[?25h');
        };
        const finish = (selections) => {
            if (finished)
                return;
            finished = true;
            cleanup();
            output.write('\n');
            resolve(selections);
        };
        const fail = (error) => {
            if (finished)
                return;
            finished = true;
            cleanup();
            output.write('\n');
            reject(error);
        };
        const render = () => {
            output.write('\u001b[H\u001b[J');
            output.write('\u001b[?25l');
            output.write(renderInteractiveQuestionFrame(record, state));
        };
        const onKeypress = (_, key) => {
            if (key.ctrl && key.name === 'c') {
                fail(new Error('Question UI cancelled by user.'));
                return;
            }
            const update = applyInteractiveSelectionKey(record, state, key);
            state = update.state;
            render();
            if (!update.submit)
                return;
            if (isMultiAnswerableQuestion(record)) {
                finish(state.selectedIndices.map((index) => index + 1));
                return;
            }
            finish([state.cursorIndex + 1]);
        };
        emitKeypressEvents(input);
        input.setRawMode?.(true);
        input.resume?.();
        input.on('keypress', onKeypress);
        render();
    });
}
async function promptForSelectionsWithNumbers(record, deps = {}) {
    const input = deps.input ?? defaultInput;
    const output = deps.output ?? defaultOutput;
    const rl = createPromptInterface({ input: input, output: output });
    try {
        output.write('\n');
        if (record.header)
            output.write(`${record.header}\n`);
        output.write(`${record.question}\n\n`);
        output.write(`${renderOptions(record).join('\n')}\n\n`);
        const optionCount = record.options.length + (record.allow_other ? 1 : 0);
        const prompt = isMultiAnswerableQuestion(record)
            ? 'Choose one or more options by number (comma-separated): '
            : 'Choose an option by number: ';
        let selections = null;
        while (!selections) {
            selections = parseSelection(await rl.question(prompt), optionCount, isMultiAnswerableQuestion(record));
            if (!selections)
                output.write('Invalid selection. Please try again.\n');
        }
        return selections;
    }
    finally {
        rl.close();
    }
}
async function promptForOtherText(label, deps = {}) {
    const input = deps.input ?? defaultInput;
    const output = deps.output ?? defaultOutput;
    const rl = createPromptInterface({ input: input, output: output });
    try {
        while (true) {
            const candidate = (await rl.question(`${label}: `)).trim();
            if (candidate)
                return candidate;
            output.write('Please enter a response.\n');
        }
    }
    finally {
        rl.close();
    }
}
export async function runQuestionUi(recordPath, deps = {}) {
    const record = await readQuestionRecord(recordPath);
    if (!record)
        throw new Error(`Question record not found: ${recordPath}`);
    const input = deps.input ?? defaultInput;
    const output = deps.output ?? defaultOutput;
    try {
        const selections = supportsInteractiveArrowUi(input, output)
            ? await promptForSelectionsWithArrows(record, { input, output })
            : await promptForSelectionsWithNumbers(record, { input, output });
        let otherText;
        if (record.allow_other && selections.includes(record.options.length + 1)) {
            otherText = await promptForOtherText(record.other_label, { input, output });
        }
        const answer = buildAnswer(record, selections, otherText);
        const answeredRecord = await markQuestionAnswered(recordPath, answer);
        maybeInjectAnswer(answeredRecord, answer, {
            env: deps.env,
            injectAnswerToPane: deps.injectAnswerToPane,
        });
    }
    catch (error) {
        await markQuestionTerminalError(recordPath, 'error', 'question_ui_failed', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
//# sourceMappingURL=ui.js.map