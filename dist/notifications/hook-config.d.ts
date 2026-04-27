/**
 * Hook Notification Config Reader
 *
 * Reads hookTemplates from .omx-config.json for user-customizable message templates.
 * Config is stored under the notifications.hookTemplates key in codexHome()/.omx-config.json.
 * Env var OMX_HOOK_CONFIG overrides to a separate file path.
 */
import type { HookNotificationConfig } from "./hook-config-types.js";
import type { FullNotificationConfig, NotificationEvent, NotificationPlatform } from "./types.js";
/**
 * Read and cache the hook notification config.
 *
 * Primary source: notifications.hookTemplates key in codexHome()/.omx-config.json
 * Env var override: OMX_HOOK_CONFIG points to a separate file containing the
 *   HookNotificationConfig JSON directly (used for testing and advanced overrides).
 *
 * - Returns null when config does not exist (no error)
 * - Returns null when config has `enabled: false`
 * - Caches after first read for performance
 */
export declare function getHookConfig(): HookNotificationConfig | null;
/**
 * Clear the cached hook config. Call in tests to reset state.
 */
export declare function resetHookConfigCache(): void;
/**
 * Resolve the template for a specific event and platform.
 *
 * Cascade: platform override > event template > defaultTemplate > null
 */
export declare function resolveEventTemplate(hookConfig: HookNotificationConfig | null, event: NotificationEvent, platform: NotificationPlatform): string | null;
/**
 * Merge hook config event enabled/disabled flags into a FullNotificationConfig.
 *
 * Hook config takes precedence for event gating:
 * - hook event `enabled: false` overrides .omx-config.json event `enabled: true`
 * - Platform credentials are NOT affected (they stay in .omx-config.json)
 */
export declare function mergeHookConfigIntoNotificationConfig(hookConfig: HookNotificationConfig, notifConfig: FullNotificationConfig): FullNotificationConfig;
//# sourceMappingURL=hook-config.d.ts.map