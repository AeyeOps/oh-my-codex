export interface TmuxPaneSnapshot {
    paneId: string;
    currentCommand: string;
    startCommand: string;
}
type TmuxExecSync = (args: string[]) => string;
export declare function parseTmuxPaneSnapshot(output: string): TmuxPaneSnapshot[];
export declare function isHudWatchPane(pane: TmuxPaneSnapshot): boolean;
export declare function findHudWatchPaneIds(panes: TmuxPaneSnapshot[], currentPaneId?: string): string[];
export declare function parsePaneIdFromTmuxOutput(rawOutput: string): string | null;
export declare function shellEscapeSingle(value: string): string;
export declare function buildHudWatchCommand(omxBin: string, preset?: string, sessionId?: string): string;
export declare function listCurrentWindowPanes(execTmuxSync?: TmuxExecSync, currentPaneId?: string): TmuxPaneSnapshot[];
export declare function listCurrentWindowHudPaneIds(currentPaneId?: string, execTmuxSync?: TmuxExecSync): string[];
export declare function readCurrentWindowSize(execTmuxSync?: TmuxExecSync, currentPaneId?: string): {
    width: number | null;
    height: number | null;
};
export declare function createHudWatchPane(cwd: string, hudCmd: string, options?: {
    heightLines?: number;
    fullWidth?: boolean;
    targetPaneId?: string;
}, execTmuxSync?: TmuxExecSync): string | null;
export declare function killTmuxPane(paneId: string, execTmuxSync?: TmuxExecSync): boolean;
export declare function resizeTmuxPane(paneId: string, heightLines: number, execTmuxSync?: TmuxExecSync): boolean;
export {};
//# sourceMappingURL=tmux.d.ts.map