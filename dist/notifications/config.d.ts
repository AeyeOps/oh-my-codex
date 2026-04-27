/**
 * Notification Configuration Reader
 *
 * Reads notification config from .omx-config.json and provides
 * backward compatibility with the old stopHookCallbacks format.
 */
import type { FullNotificationConfig, NotificationsBlock, NotificationEvent, NotificationPlatform, VerbosityLevel } from "./types.js";
export declare function validateMention(raw: string | undefined): string | undefined;
/**
 * Validate Slack mention format.
 * Accepts: <@UXXXXXXXX> (user), <!channel>, <!here>, <!everyone>, <!subteam^SXXXXXXXXX> (user group).
 * Returns the mention string if valid, undefined otherwise.
 */
export declare function validateSlackMention(raw: string | undefined): string | undefined;
export declare function parseMentionAllowedMentions(mention: string | undefined): {
    users?: string[];
    roles?: string[];
};
export declare function buildConfigFromEnv(): FullNotificationConfig | null;
/**
 * Resolve a named profile from the notifications block.
 *
 * Priority:
 *   1. Explicit `profileName` argument
 *   2. OMX_NOTIFY_PROFILE environment variable
 *   3. `defaultProfile` field in config
 *   4. null (no profile selected → fall back to flat config)
 */
export declare function resolveProfileConfig(notifications: NotificationsBlock, profileName?: string): FullNotificationConfig | null;
/**
 * List available profile names from the config file.
 */
export declare function listProfiles(): string[];
/**
 * Get the active profile name based on resolution priority.
 * Returns null if no profile is active (flat config mode).
 */
export declare function getActiveProfileName(): string | null;
export declare function getNotificationConfig(profileName?: string): FullNotificationConfig | null;
/**
 * Resolve the effective verbosity level.
 * Priority: env var > config field > default ("session").
 */
export declare function getVerbosity(config: FullNotificationConfig | null): VerbosityLevel;
/**
 * Check whether a given event is allowed at the specified verbosity level.
 */
export declare function isEventAllowedByVerbosity(verbosity: VerbosityLevel, event: NotificationEvent): boolean;
/**
 * Whether the given verbosity level should include tmux tail output.
 */
export declare function shouldIncludeTmuxTail(verbosity: VerbosityLevel): boolean;
export declare function isEventEnabled(config: FullNotificationConfig, event: NotificationEvent): boolean;
export declare function getEnabledPlatforms(config: FullNotificationConfig, event: NotificationEvent): NotificationPlatform[];
export declare function getReplyListenerPlatformConfig(config: FullNotificationConfig | null): {
    telegramEnabled: boolean;
    telegramBotToken?: string;
    telegramChatId?: string;
    discordEnabled: boolean;
    discordBotToken?: string;
    discordChannelId?: string;
    discordMention?: string;
};
export declare function getReplyConfig(): import("./types.js").ReplyConfig | null;
//# sourceMappingURL=config.d.ts.map