/**
 * Notification Dispatcher
 *
 * Sends notifications to configured platforms (Discord, Telegram, Slack, webhook).
 * All sends are non-blocking with timeouts. Failures are swallowed to avoid
 * blocking hooks.
 */
import type { DiscordNotificationConfig, DiscordBotNotificationConfig, TelegramNotificationConfig, SlackNotificationConfig, WebhookNotificationConfig, FullNotificationPayload, NotificationResult, DispatchResult, FullNotificationConfig, NotificationEvent } from "./types.js";
export declare function sendDiscord(config: DiscordNotificationConfig, payload: FullNotificationPayload): Promise<NotificationResult>;
export declare function sendDiscordBot(config: DiscordBotNotificationConfig, payload: FullNotificationPayload): Promise<NotificationResult>;
export declare function sendTelegram(config: TelegramNotificationConfig, payload: FullNotificationPayload): Promise<NotificationResult>;
export declare function sendSlack(config: SlackNotificationConfig, payload: FullNotificationPayload): Promise<NotificationResult>;
export declare function sendWebhook(config: WebhookNotificationConfig, payload: FullNotificationPayload): Promise<NotificationResult>;
export declare function dispatchNotifications(config: FullNotificationConfig, event: NotificationEvent, payload: FullNotificationPayload): Promise<DispatchResult>;
//# sourceMappingURL=dispatcher.d.ts.map