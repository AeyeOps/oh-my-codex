/**
 * Notification Message Formatters
 *
 * Produces human-readable notification messages for each event type.
 * Supports markdown (Discord/Telegram) and plain text (Slack/webhook) formats.
 */
import type { FullNotificationPayload } from "./types.js";
/**
 * Parse raw tmux pane output into clean, human-readable text suitable for
 * inclusion in a notification message.
 *
 * - Strips ANSI escape codes
 * - Removes UI chrome lines (spinner/progress characters: ●⎿✻·◼)
 * - Removes "ctrl+o to expand" hint lines
 * - Removes box-drawing character lines
 * - Removes OMX HUD status lines
 * - Removes bypass-permissions indicator lines
 * - Removes bare shell prompt lines
 * - Drops lines with < 15% Unicode letter/number density (for lines >= 8 chars)
 * - Groups indented continuation lines into the previous logical block
 * - Keeps the most recent 10 logical blocks within a 1200-character budget
 */
export declare function parseTmuxTail(raw: string): string;
export declare function formatSessionStart(payload: FullNotificationPayload): string;
export declare function formatSessionStop(payload: FullNotificationPayload): string;
export declare function formatSessionEnd(payload: FullNotificationPayload): string;
export declare function formatSessionIdle(payload: FullNotificationPayload): string;
export declare function formatAskUserQuestion(payload: FullNotificationPayload): string;
export declare function formatNotification(payload: FullNotificationPayload): string;
//# sourceMappingURL=formatter.d.ts.map