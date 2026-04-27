import { readHudConfig } from './state.js';
import { type TmuxPaneSnapshot } from './tmux.js';
import { resolveOmxCliEntryPath } from '../utils/paths.js';
export interface ReconcileHudForPromptSubmitResult {
    status: 'skipped_not_tmux' | 'skipped_no_entry' | 'resized' | 'recreated' | 'replaced_duplicates' | 'failed';
    paneId: string | null;
    desiredHeight: number | null;
    duplicateCount: number;
}
export interface ReconcileHudForPromptSubmitDeps {
    env?: NodeJS.ProcessEnv;
    sessionId?: string;
    listCurrentWindowPanes?: (currentPaneId?: string) => TmuxPaneSnapshot[];
    createHudWatchPane?: (cwd: string, hudCmd: string, options?: {
        heightLines?: number;
        fullWidth?: boolean;
        targetPaneId?: string;
    }) => string | null;
    killTmuxPane?: (paneId: string) => boolean;
    resizeTmuxPane?: (paneId: string, heightLines: number) => boolean;
    readHudConfig?: typeof readHudConfig;
    resolveOmxCliEntryPath?: typeof resolveOmxCliEntryPath;
}
export declare function reconcileHudForPromptSubmit(cwd: string, deps?: ReconcileHudForPromptSubmitDeps): Promise<ReconcileHudForPromptSubmitResult>;
//# sourceMappingURL=reconcile.d.ts.map