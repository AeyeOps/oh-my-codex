/**
 * Reply Listener Daemon
 *
 * Background daemon that polls Discord and Telegram for replies to notification messages,
 * sanitizes input, verifies the target pane, and injects reply text via sendToPane().
 *
 * Security considerations:
 * - State/PID/log files use restrictive permissions (0600)
 * - Bot tokens stored in state file, NOT in environment variables
 * - Two-layer input sanitization (sanitizeReplyInput + newline stripping in buildSendPaneArgvs)
 * - Pane verification via analyzePaneContent before every injection
 * - Authorization: only configured user IDs (Discord) / chat ID (Telegram) can inject
 * - Rate limiting to prevent spam/abuse
 */
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { request as httpsRequest } from 'https';
import { capturePaneContent } from './tmux-detector.js';
import { lookupByMessageId } from './session-registry.js';
import { buildDiscordSessionStatusReply } from './session-status.js';
import { parseMentionAllowedMentions } from './config.js';
import { parseTmuxTail } from './formatter.js';
import type { ReplyConfig } from './types.js';
export interface ReplyListenerState {
    isRunning: boolean;
    pid: number | null;
    startedAt: string | null;
    lastPollAt: string | null;
    telegramLastUpdateId: number | null;
    discordLastMessageId: string | null;
    messagesInjected: number;
    errors: number;
    lastError?: string;
}
export interface ReplyListenerDaemonConfig extends ReplyConfig {
    telegramEnabled?: boolean;
    telegramBotToken?: string;
    telegramChatId?: string;
    discordEnabled?: boolean;
    discordBotToken?: string;
    discordChannelId?: string;
    discordMention?: string;
}
export interface DaemonResponse {
    success: boolean;
    message: string;
    state?: ReplyListenerState;
    error?: string;
}
declare function log(message: string): void;
export declare function normalizeReplyListenerConfig(config: ReplyListenerDaemonConfig): ReplyListenerDaemonConfig;
declare function writeDaemonState(state: ReplyListenerState): void;
/**
 * Verify that the process with the given PID is our reply listener daemon by
 * inspecting its command line for the daemon identity marker. Returns false if
 * the process cannot be positively identified (safe default).
 */
export declare function isReplyListenerProcess(pid: number, options?: {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    existsImpl?: typeof existsSync;
    spawnImpl?: typeof spawnSync;
}): boolean;
export declare function isDaemonRunning(): boolean;
export declare function sanitizeReplyInput(text: string): string;
export interface ReplyListenerRateLimiter {
    canProceed(): boolean;
    reset(): void;
}
export declare class RateLimiter implements ReplyListenerRateLimiter {
    private readonly maxPerMinute;
    private timestamps;
    private readonly windowMs;
    constructor(maxPerMinute: number);
    canProceed(): boolean;
    reset(): void;
}
interface ReplyAcknowledgementDeps {
    capturePaneContentImpl?: typeof capturePaneContent;
    parseTmuxTailImpl?: typeof parseTmuxTail;
}
export interface ReplyListenerDiscordPollDeps {
    fetchImpl?: typeof fetch;
    lookupByMessageIdImpl?: typeof lookupByMessageId;
    injectReplyImpl?: typeof injectReply;
    captureReplyAcknowledgementSummaryImpl?: typeof captureReplyAcknowledgementSummary;
    formatReplyAcknowledgementImpl?: typeof formatReplyAcknowledgement;
    writeDaemonStateImpl?: typeof writeDaemonState;
    logImpl?: typeof log;
}
export interface ReplyListenerTelegramPollDeps {
    httpsRequestImpl?: typeof httpsRequest;
    lookupByMessageIdImpl?: typeof lookupByMessageId;
    injectReplyImpl?: typeof injectReply;
    captureReplyAcknowledgementSummaryImpl?: typeof captureReplyAcknowledgementSummary;
    formatReplyAcknowledgementImpl?: typeof formatReplyAcknowledgement;
    writeDaemonStateImpl?: typeof writeDaemonState;
    logImpl?: typeof log;
}
export interface ReplyListenerPollDeps {
    fetchImpl?: typeof fetch;
    httpsRequestImpl?: typeof httpsRequest;
    injectReplyImpl?: typeof injectReply;
    buildSessionStatusReplyImpl?: typeof buildDiscordSessionStatusReply;
    captureReplyAcknowledgementSummaryImpl?: typeof captureReplyAcknowledgementSummary;
    lookupByMessageIdImpl?: typeof lookupByMessageId;
    writeDaemonStateImpl?: typeof writeDaemonState;
    parseMentionAllowedMentionsImpl?: typeof parseMentionAllowedMentions;
    logImpl?: typeof log;
}
export declare function redactSensitiveTokens(text: string): string;
export declare function captureReplyAcknowledgementSummary(paneId: string, deps?: ReplyAcknowledgementDeps): string | null;
export declare function formatReplyAcknowledgement(summary: string | null): string;
declare function injectReply(paneId: string, text: string, platform: string, config: ReplyListenerDaemonConfig): boolean;
export declare function resetReplyListenerTransientState(): void;
export declare function pollDiscordOnce(config: ReplyListenerDaemonConfig, state: ReplyListenerState, rateLimiter: ReplyListenerRateLimiter, deps?: ReplyListenerPollDeps): Promise<void>;
export declare function pollTelegramOnce(config: ReplyListenerDaemonConfig, state: ReplyListenerState, rateLimiter: ReplyListenerRateLimiter, deps?: ReplyListenerPollDeps): Promise<void>;
declare function pollLoop(): Promise<void>;
export declare function startReplyListener(config: ReplyListenerDaemonConfig): DaemonResponse;
export declare function stopReplyListener(): DaemonResponse;
export declare function getReplyListenerStatus(): DaemonResponse;
export { pollLoop };
//# sourceMappingURL=reply-listener.d.ts.map