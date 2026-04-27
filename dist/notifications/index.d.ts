/**
 * Notification System - Public API
 *
 * Multi-platform lifecycle notifications for oh-my-codex.
 * Sends notifications to Discord, Telegram, Slack, and generic webhooks
 * on session lifecycle events.
 *
 * Usage:
 *   import { notifyLifecycle } from '../notifications/index.js';
 *   await notifyLifecycle('session-start', { sessionId, projectPath, ... });
 */
export type { NotificationEvent, NotificationPlatform, FullNotificationConfig, FullNotificationPayload, NotificationResult, DispatchResult, DiscordNotificationConfig, DiscordBotNotificationConfig, TelegramNotificationConfig, SlackNotificationConfig, WebhookNotificationConfig, EventNotificationConfig, ReplyConfig, NotificationProfilesConfig, NotificationsBlock, VerbosityLevel, } from "./types.js";
export { dispatchNotifications, sendDiscord, sendDiscordBot, sendTelegram, sendSlack, sendWebhook, } from "./dispatcher.js";
export { formatNotification, formatSessionStart, formatSessionStop, formatSessionEnd, formatSessionIdle, formatAskUserQuestion, } from "./formatter.js";
export { getCurrentTmuxSession, getCurrentTmuxPaneId, getTeamTmuxSessions, formatTmuxInfo, captureTmuxPane, sanitizeTmuxAlertText, } from "./tmux.js";
export { getNotificationConfig, isEventEnabled, getEnabledPlatforms, getReplyConfig, getReplyListenerPlatformConfig, resolveProfileConfig, listProfiles, getActiveProfileName, getVerbosity, isEventAllowedByVerbosity, shouldIncludeTmuxTail, } from "./config.js";
export { registerMessage, loadAllMappings, lookupByMessageId, removeSession, removeMessagesByPane, pruneStale, } from "./session-registry.js";
export type { SessionMapping } from "./session-registry.js";
export { startReplyListener, stopReplyListener, getReplyListenerStatus, isDaemonRunning, sanitizeReplyInput, } from "./reply-listener.js";
export { notify, loadNotificationConfig } from "./notifier.js";
export type { NotificationConfig, NotificationPayload } from "./notifier.js";
export { getDispatchNotificationCooldownSeconds, shouldSendDispatchNotification, recordDispatchNotificationSent, } from "./dispatch-cooldown.js";
export { getIdleNotificationCooldownSeconds, shouldSendIdleNotification, recordIdleNotificationSent, } from "./idle-cooldown.js";
export { interpolateTemplate, validateTemplate, computeTemplateVariables, getDefaultTemplate, } from "./template-engine.js";
export { getHookConfig, resetHookConfigCache, resolveEventTemplate, mergeHookConfigIntoNotificationConfig, } from "./hook-config.js";
export type { HookNotificationConfig, HookEventConfig, PlatformTemplateOverride, TemplateVariable, } from "./hook-config-types.js";
import type { NotificationEvent, FullNotificationPayload, DispatchResult } from "./types.js";
import { type NotifyTempContract } from "./temp-contract.js";
import type { OpenClawHookEvent } from "../openclaw/types.js";
export declare function shouldDispatchOpenClaw(event: OpenClawHookEvent, tempContract: NotifyTempContract | null, env?: NodeJS.ProcessEnv): Promise<boolean>;
/**
 * High-level notification function for lifecycle events.
 *
 * Reads config, checks if the event is enabled, formats the message,
 * and dispatches to all configured platforms. Non-blocking, swallows errors.
 */
export declare function notifyLifecycle(event: NotificationEvent, data: Partial<FullNotificationPayload> & {
    sessionId: string;
}, profileName?: string): Promise<DispatchResult | null>;
//# sourceMappingURL=index.d.ts.map