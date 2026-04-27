/**
 * Idle Notification Cooldown
 *
 * Prevents flooding users with session-idle notifications by enforcing a
 * minimum interval between dispatches. Ported from OMC persistent-mode hook.
 *
 * Config key : notifications.idleCooldownSeconds in ~/.codex/.omx-config.json
 * Env var    : OMX_IDLE_COOLDOWN_SECONDS  (overrides config)
 * State file : .omx/state/idle-notif-cooldown.json
 *              (session-scoped when sessionId is available)
 *
 * A cooldown value of 0 disables throttling entirely.
 */
/**
 * Read the idle notification cooldown in seconds.
 *
 * Resolution order:
 *   1. OMX_IDLE_COOLDOWN_SECONDS env var
 *   2. notifications.idleCooldownSeconds in ~/.codex/.omx-config.json
 *   3. Default: 60 seconds
 */
export declare function getIdleNotificationCooldownSeconds(): number;
/**
 * Check whether an idle notification should be sent.
 *
 * Without a fingerprint this preserves the legacy cooldown-only behavior.
 * With a fingerprint it suppresses unchanged idle-state repeats until the
 * fingerprint meaningfully changes.
 */
export declare function shouldSendIdleNotification(stateDir: string, sessionId?: string, fingerprint?: string): boolean;
/**
 * Record that an idle notification was sent at the current timestamp.
 * Call this after a successful dispatch to arm the cooldown and optionally
 * persist the current idle-state fingerprint.
 */
export declare function recordIdleNotificationSent(stateDir: string, sessionId?: string, fingerprint?: string): void;
/**
 * Check whether the coarse session-idle hook event should be dispatched.
 *
 * This path intentionally stays transition-based even when the lifecycle
 * notification cooldown is set to 0, because downstream hook consumers only
 * see the coarse `post_turn_idle_notification` reason and otherwise cannot
 * distinguish unchanged repeats from new blocked states.
 */
export declare function shouldSendSessionIdleHookEvent(stateDir: string, sessionId?: string, fingerprint?: string): boolean;
/**
 * Record that the coarse session-idle hook event was dispatched.
 */
export declare function recordSessionIdleHookEventSent(stateDir: string, sessionId?: string, fingerprint?: string): void;
/**
 * Check whether a session-idle notification should include the captured tmux tail.
 *
 * Repeated idle notifications often reuse the same pane history. When the parsed
 * tail text is unchanged, downstream keyword scanners should not see it again.
 */
export declare function shouldIncludeSessionIdleTmuxTail(stateDir: string, sessionId?: string, tmuxTailFingerprint?: string): boolean;
/**
 * Record the parsed tmux-tail fingerprint last included in a session-idle notification.
 */
export declare function recordSessionIdleTmuxTailSent(stateDir: string, sessionId?: string, tmuxTailFingerprint?: string): void;
//# sourceMappingURL=idle-cooldown.d.ts.map