/**
 * Session Registry Module
 *
 * Maps platform message IDs to tmux pane IDs for reply correlation.
 * Uses JSONL append format for atomic writes with cross-process locking.
 *
 * Registry location: ~/.omx/state/reply-session-registry.jsonl (global, not worktree-local)
 * File permissions: 0600 (owner read/write only)
 */
export interface SessionMapping {
    platform: "discord-bot" | "telegram";
    messageId: string;
    sessionId: string;
    tmuxPaneId: string;
    tmuxSessionName: string;
    event: string;
    createdAt: string;
    projectPath?: string;
}
export declare function registerMessage(mapping: SessionMapping): boolean;
export declare function loadAllMappings(): SessionMapping[];
export declare function lookupByMessageId(platform: string, messageId: string): SessionMapping | null;
export declare function removeSession(sessionId: string): void;
export declare function removeMessagesByPane(paneId: string): void;
export declare function pruneStale(): void;
//# sourceMappingURL=session-registry.d.ts.map