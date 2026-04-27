/**
 * One-time GitHub star prompt shown at OMX startup.
 * Skipped when no TTY or when gh CLI is not installed.
 * State stored globally (~/.omx/state/star-prompt.json) so it shows once per user.
 */
import * as childProcess from 'child_process';
export declare function starPromptStatePath(): string;
export declare function hasBeenPrompted(): Promise<boolean>;
export declare function markPrompted(): Promise<void>;
export declare function isGhInstalled(): boolean;
export type StarRepoResult = {
    ok: true;
} | {
    ok: false;
    error: string;
};
interface MaybePromptGithubStarDeps {
    stdinIsTTY?: boolean;
    stdoutIsTTY?: boolean;
    hasBeenPromptedFn?: () => Promise<boolean>;
    isGhInstalledFn?: () => boolean;
    markPromptedFn?: () => Promise<void>;
    askYesNoFn?: (question: string) => Promise<boolean>;
    starRepoFn?: () => StarRepoResult;
    logFn?: (message: string) => void;
    warnFn?: (message: string) => void;
}
export declare function starRepo(spawnSyncFn?: typeof childProcess.spawnSync): StarRepoResult;
export declare function maybePromptGithubStar(deps?: MaybePromptGithubStarDeps): Promise<void>;
export {};
//# sourceMappingURL=star-prompt.d.ts.map