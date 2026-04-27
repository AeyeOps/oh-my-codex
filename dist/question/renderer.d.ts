import { type ChildProcess, type SpawnOptions } from 'node:child_process';
import type { QuestionAnswer, QuestionRendererState } from './types.js';
export type QuestionRendererStrategy = 'inside-tmux' | 'detached-tmux' | 'inline-tty' | 'windows-console' | 'test-noop' | 'unsupported';
export interface LaunchQuestionRendererOptions {
    cwd: string;
    recordPath: string;
    sessionId?: string;
    env?: NodeJS.ProcessEnv;
    nowIso?: string;
    platform?: NodeJS.Platform;
    stdinIsTTY?: boolean;
    stdoutIsTTY?: boolean;
}
export type ExecTmuxSync = (args: string[]) => string;
export type SleepSync = (ms: number) => void;
export type SpawnDetachedRenderer = (command: string, args: string[], options: SpawnOptions) => Pick<ChildProcess, 'pid' | 'unref'>;
export declare function resolveQuestionRendererStrategy(env?: NodeJS.ProcessEnv, _tmuxBinary?: string | null, options?: {
    cwd?: string;
    sessionId?: string;
    platform?: NodeJS.Platform;
    stdinIsTTY?: boolean;
    stdoutIsTTY?: boolean;
}): QuestionRendererStrategy;
export declare function isLaunchedQuestionPaneAlive(paneId: string, execTmux: ExecTmuxSync): boolean;
export declare function isLaunchedQuestionSessionAlive(sessionName: string, execTmux: ExecTmuxSync): boolean;
export declare function isWindowsConsoleRendererAlive(pid: number | undefined): boolean;
export declare function isQuestionRendererAlive(renderer: QuestionRendererState | undefined, execTmux?: ExecTmuxSync): boolean;
export declare function formatQuestionAnswerForInjection(answer: QuestionAnswer): string;
export declare function injectQuestionAnswerToPane(paneId: string, answer: QuestionAnswer, execTmux?: ExecTmuxSync, sleepImpl?: SleepSync): boolean;
export declare function launchQuestionRenderer(options: LaunchQuestionRendererOptions, deps?: {
    strategy?: QuestionRendererStrategy;
    execTmux?: ExecTmuxSync;
    sleepSync?: SleepSync;
    spawnDetachedRenderer?: SpawnDetachedRenderer;
}): QuestionRendererState;
//# sourceMappingURL=renderer.d.ts.map