import type { HookEventEnvelope, HookEventName, HookEventSource } from './types.js';
interface BuildHookEventOptions {
    source?: HookEventSource;
    timestamp?: string;
    context?: Record<string, unknown>;
    session_id?: string;
    thread_id?: string;
    turn_id?: string;
    mode?: string;
    confidence?: number;
    parser_reason?: string;
}
export declare function isDerivedEventName(event: string): boolean;
export declare function buildHookEvent(event: HookEventName | string, options?: BuildHookEventOptions): HookEventEnvelope;
export declare function buildNativeHookEvent(event: HookEventName | string, context?: Record<string, unknown>, options?: Omit<BuildHookEventOptions, 'source' | 'confidence' | 'parser_reason' | 'context'>): HookEventEnvelope;
export declare function buildDerivedHookEvent(event: HookEventName | string, context?: Record<string, unknown>, options?: Omit<BuildHookEventOptions, 'source' | 'context'>): HookEventEnvelope;
export {};
//# sourceMappingURL=events.d.ts.map