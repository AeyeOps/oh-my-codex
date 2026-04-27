import type { NotificationEvent, FullNotificationPayload } from './types.js';
export declare function shouldDedupeLifecycleNotification(event: NotificationEvent): boolean;
export declare function createLifecycleBroadcastFingerprint(value: unknown): string;
export declare function shouldSendLifecycleNotification(stateDir: string, payload: FullNotificationPayload, nowMs?: number): boolean;
export declare function recordLifecycleNotificationSent(stateDir: string, payload: FullNotificationPayload, nowMs?: number): void;
export declare function shouldSendLifecycleHookBroadcast(stateDir: string, sessionId: string | undefined, eventKey: string, fingerprint: string, nowMs?: number): boolean;
export declare function recordLifecycleHookBroadcastSent(stateDir: string, sessionId: string | undefined, eventKey: string, fingerprint: string, nowMs?: number): void;
//# sourceMappingURL=lifecycle-dedupe.d.ts.map