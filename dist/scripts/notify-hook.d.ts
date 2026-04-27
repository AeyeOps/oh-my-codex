#!/usr/bin/env node
/**
 * oh-my-codex Notification Hook
 * Codex CLI fires this after each agent turn via the `notify` config.
 * Receives JSON payload as the last argv argument.
 *
 * Responsibilities are split into sub-modules under scripts/notify-hook/:
 *   utils.js           – pure helpers (asNumber, safeString, …)
 *   payload-parser.js  – payload field extraction
 *   state-io.js        – state file I/O and normalization
 *   process-runner.js  – child-process helper
 *   log.js             – structured event logging
 *   auto-nudge.js      – stall-pattern detection and auto-nudge
 *   tmux-injection.js  – tmux prompt injection
 *   team-dispatch.js   – durable team dispatch queue consumer
 *   team-leader-nudge.js – leader mailbox nudge
 *   team-worker.js     – worker heartbeat and idle notification
 */
export {};
//# sourceMappingURL=notify-hook.d.ts.map