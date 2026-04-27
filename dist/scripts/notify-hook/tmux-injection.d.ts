/**
 * Tmux prompt injection for notify-hook.
 * Handles pane resolution, injection guards, and state healing.
 */
export declare function resolveSessionToPane(sessionName: any): Promise<string | null>;
export declare function resolvePaneTarget(target: any, expectedCwd: any, modePane: any, cwd: string, payload: any): Promise<any>;
export declare function handleTmuxInjection({ payload, cwd, stateDir, logsDir, }: any): Promise<void>;
//# sourceMappingURL=tmux-injection.d.ts.map