/**
 * Notification system for oh-my-codex
 * Supports desktop notifications, Discord webhooks, and Telegram bots
 */
export interface NotificationConfig {
    desktop?: boolean;
    discord?: {
        webhookUrl: string;
    };
    telegram?: {
        botToken: string;
        chatId: string;
    };
}
export interface NotificationPayload {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    mode?: string;
    projectPath?: string;
}
interface JsonHttpsRequestOptions {
    hostname: string;
    path: string;
    body: string;
    errorPrefix: string;
    timeoutMs?: number;
}
/**
 * Load notification config from .omx/notifications.json
 */
export declare function loadNotificationConfig(projectRoot?: string): Promise<NotificationConfig | null>;
/**
 * Send notification via all configured channels
 */
export declare function notify(payload: NotificationPayload, config?: NotificationConfig | null): Promise<void>;
/**
 * Build the execFile command and args for a desktop notification.
 * Exported for unit testing.
 */
export declare function _buildDesktopArgs(title: string, message: string, platform: string): [string, string[]] | null;
export declare function _sendJsonHttpsRequest(options: JsonHttpsRequestOptions): Promise<void>;
export {};
//# sourceMappingURL=notifier.d.ts.map