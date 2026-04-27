export interface ModeStateContextLike {
    active?: unknown;
    tmux_pane_id?: unknown;
    tmux_pane_set_at?: unknown;
    [key: string]: unknown;
}
export declare function captureTmuxPaneFromEnv(env?: NodeJS.ProcessEnv): string | null;
export declare function withModeRuntimeContext<T extends ModeStateContextLike>(existing: ModeStateContextLike, next: T, options?: {
    env?: NodeJS.ProcessEnv;
    nowIso?: string;
}): T;
//# sourceMappingURL=mode-state-context.d.ts.map