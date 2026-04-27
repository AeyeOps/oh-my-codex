/**
 * Dispatch Notification Cooldown
 *
 * Prevents flooding users with team dispatch notifications by enforcing a
 * minimum interval between dispatches. Similar to idle-cooldown.ts but
 * specifically for dispatch-related notifications.
 *
 * Config key : notifications.dispatchCooldownSeconds in ~/.codex/.omx-config.json
 * Env var    : OMX_DISPATCH_COOLDOWN_SECONDS  (overrides config)
 * State file : .omx/state/dispatch-notif-cooldown.json
 *              (session-scoped when sessionId is available)
 *
 * A cooldown value of 0 disables throttling entirely.
 */
/**
 * Read the dispatch notification cooldown in seconds.
 *
 * Resolution order:
 *   1. OMX_DISPATCH_COOLDOWN_SECONDS env var
 *   2. notifications.dispatchCooldownSeconds in ~/.codex/.omx-config.json
 *   3. Default: 60 seconds
 */
export declare function getDispatchNotificationCooldownSeconds(): number;
/**
 * Check whether the dispatch notification cooldown has elapsed.
 *
 * Returns true if the notification should be sent (cooldown has elapsed or is disabled).
 * Returns false if the notification should be suppressed (too soon since last send).
 */
export declare function shouldSendDispatchNotification(stateDir: string, sessionId?: string): boolean;
/**
 * Record that a dispatch notification was sent at the current timestamp.
 * Call this after a successful dispatch to arm the cooldown.
 */
export declare function recordDispatchNotificationSent(stateDir: string, sessionId?: string): void;
//# sourceMappingURL=dispatch-cooldown.d.ts.map