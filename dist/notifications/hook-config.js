/**
 * Hook Notification Config Reader
 *
 * Reads hookTemplates from .omx-config.json for user-customizable message templates.
 * Config is stored under the notifications.hookTemplates key in codexHome()/.omx-config.json.
 * Env var OMX_HOOK_CONFIG overrides to a separate file path.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { codexHome } from "../utils/paths.js";
/** Cached hook config. `undefined` = not yet read, `null` = read but absent/disabled. */
let cachedConfig;
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
export function getHookConfig() {
    if (cachedConfig !== undefined)
        return cachedConfig;
    const envOverridePath = process.env.OMX_HOOK_CONFIG;
    if (envOverridePath) {
        // Env var: read HookNotificationConfig directly from separate file
        if (!existsSync(envOverridePath)) {
            cachedConfig = null;
            return null;
        }
        try {
            const raw = JSON.parse(readFileSync(envOverridePath, "utf-8"));
            if (!raw || raw.enabled === false) {
                cachedConfig = null;
                return null;
            }
            cachedConfig = raw;
            return cachedConfig;
        }
        catch {
            cachedConfig = null;
            return null;
        }
    }
    // Primary: read from notifications.hookTemplates in .omx-config.json
    const OMX_CONFIG_PATH = join(codexHome(), ".omx-config.json");
    if (!existsSync(OMX_CONFIG_PATH)) {
        cachedConfig = null;
        return null;
    }
    try {
        const raw = JSON.parse(readFileSync(OMX_CONFIG_PATH, "utf-8"));
        if (!raw || typeof raw !== "object") {
            cachedConfig = null;
            return null;
        }
        const hookTemplates = raw.notifications
            ? raw.notifications.hookTemplates
            : undefined;
        if (!hookTemplates || hookTemplates.enabled === false) {
            cachedConfig = null;
            return null;
        }
        cachedConfig = hookTemplates;
        return cachedConfig;
    }
    catch {
        cachedConfig = null;
        return null;
    }
}
/**
 * Clear the cached hook config. Call in tests to reset state.
 */
export function resetHookConfigCache() {
    cachedConfig = undefined;
}
/**
 * Resolve the template for a specific event and platform.
 *
 * Cascade: platform override > event template > defaultTemplate > null
 */
export function resolveEventTemplate(hookConfig, event, platform) {
    if (!hookConfig)
        return null;
    const eventConfig = hookConfig.events?.[event];
    if (eventConfig) {
        // Platform-specific override
        const platformOverride = eventConfig.platforms?.[platform];
        if (platformOverride?.template)
            return platformOverride.template;
        // Event-level template
        if (eventConfig.template)
            return eventConfig.template;
    }
    // Global default template
    return hookConfig.defaultTemplate || null;
}
/**
 * Merge hook config event enabled/disabled flags into a FullNotificationConfig.
 *
 * Hook config takes precedence for event gating:
 * - hook event `enabled: false` overrides .omx-config.json event `enabled: true`
 * - Platform credentials are NOT affected (they stay in .omx-config.json)
 */
export function mergeHookConfigIntoNotificationConfig(hookConfig, notifConfig) {
    if (!hookConfig.events)
        return notifConfig;
    const merged = { ...notifConfig };
    const events = { ...(merged.events || {}) };
    for (const [eventName, hookEventConfig] of Object.entries(hookConfig.events)) {
        if (!hookEventConfig)
            continue;
        const event = eventName;
        const existing = events[event];
        events[event] = {
            ...(existing || {}),
            enabled: hookEventConfig.enabled,
        };
    }
    merged.events = events;
    return merged;
}
//# sourceMappingURL=hook-config.js.map