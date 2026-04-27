/**
 * TS Runtime Bridge — thin wrapper over omx-runtime binary.
 *
 * All semantic state mutations route through `execCommand()`.
 * All state queries read Rust-authored compatibility JSON files.
 * Set OMX_RUNTIME_BRIDGE=0 to disable bridge (fallback to TS-direct).
 */
export interface RuntimeSnapshot {
    schema_version: number;
    authority: AuthoritySnapshot;
    backlog: BacklogSnapshot;
    replay: ReplaySnapshot;
    readiness: ReadinessSnapshot;
}
export interface AuthoritySnapshot {
    owner: string | null;
    lease_id: string | null;
    leased_until: string | null;
    stale: boolean;
    stale_reason: string | null;
}
export interface BacklogSnapshot {
    pending: number;
    notified: number;
    delivered: number;
    failed: number;
}
export interface ReplaySnapshot {
    cursor: string | null;
    pending_events: number;
    last_replayed_event_id: string | null;
    deferred_leader_notification: boolean;
}
export interface ReadinessSnapshot {
    ready: boolean;
    reasons: string[];
}
export type RuntimeCommand = {
    command: 'AcquireAuthority';
    owner: string;
    lease_id: string;
    leased_until: string;
} | {
    command: 'RenewAuthority';
    owner: string;
    lease_id: string;
    leased_until: string;
} | {
    command: 'QueueDispatch';
    request_id: string;
    target: string;
    metadata?: Record<string, unknown>;
} | {
    command: 'MarkNotified';
    request_id: string;
    channel: string;
} | {
    command: 'MarkDelivered';
    request_id: string;
} | {
    command: 'MarkFailed';
    request_id: string;
    reason: string;
} | {
    command: 'RequestReplay';
    cursor?: string;
} | {
    command: 'CaptureSnapshot';
} | {
    command: 'CreateMailboxMessage';
    message_id: string;
    from_worker: string;
    to_worker: string;
    body: string;
} | {
    command: 'MarkMailboxNotified';
    message_id: string;
} | {
    command: 'MarkMailboxDelivered';
    message_id: string;
};
export type RuntimeEvent = {
    event: 'AuthorityAcquired';
    owner: string;
    lease_id: string;
    leased_until: string;
} | {
    event: 'AuthorityRenewed';
    owner: string;
    lease_id: string;
    leased_until: string;
} | {
    event: 'DispatchQueued';
    request_id: string;
    target: string;
    metadata?: Record<string, unknown>;
} | {
    event: 'DispatchNotified';
    request_id: string;
    channel: string;
} | {
    event: 'DispatchDelivered';
    request_id: string;
} | {
    event: 'DispatchFailed';
    request_id: string;
    reason: string;
} | {
    event: 'ReplayRequested';
    cursor?: string;
} | {
    event: 'SnapshotCaptured';
} | {
    event: 'MailboxMessageCreated';
    message_id: string;
    from_worker: string;
    to_worker: string;
    body?: string;
} | {
    event: 'MailboxNotified';
    message_id: string;
} | {
    event: 'MailboxDelivered';
    message_id: string;
};
export interface DispatchRecord {
    request_id: string;
    target: string;
    status: 'pending' | 'notified' | 'delivered' | 'failed';
    created_at: string;
    notified_at: string | null;
    delivered_at: string | null;
    failed_at: string | null;
    reason: string | null;
    metadata: Record<string, unknown> | null;
}
export interface MailboxRecord {
    message_id: string;
    from_worker: string;
    to_worker: string;
    body: string;
    created_at: string;
    notified_at: string | null;
    delivered_at: string | null;
}
/**
 * Raised when the omx-runtime binary returns output that fails JSON decoding.
 *
 * Distinguishing parse failure from spawn failure (which `run()` already wraps
 * in a generic `Error`) lets callers — e.g. dispatch loops in
 * `team/state/dispatch.ts` — react with a typed `instanceof` check instead of
 * inspecting error messages, and to mark the affected command failed without
 * tearing down the surrounding watcher loop.
 */
export declare class RuntimeBridgeError extends Error {
    readonly context: {
        command?: string;
        stdoutPreview?: string;
        cause?: unknown;
    };
    constructor(message: string, context?: {
        command?: string;
        stdoutPreview?: string;
        cause?: unknown;
    });
}
export interface RuntimeBinaryDiscoveryOptions {
    debugPath?: string;
    releasePath?: string;
    fallbackBinary?: string;
    exists?: (path: string) => boolean;
}
export declare function resolveRuntimeBinaryPath(options?: RuntimeBinaryDiscoveryOptions): string;
export declare function resolveBridgeStateDir(cwd: string, env?: NodeJS.ProcessEnv): string;
export declare class RuntimeBridge {
    private binaryPath;
    private stateDir;
    private enabled;
    constructor(options?: {
        stateDir?: string;
        binaryPath?: string;
    });
    /** Whether the bridge is enabled (OMX_RUNTIME_BRIDGE != '0'). */
    isEnabled(): boolean;
    /** Execute a RuntimeCommand and return the resulting RuntimeEvent. */
    execCommand(cmd: RuntimeCommand, options?: {
        compact?: boolean;
    }): RuntimeEvent;
    /** Read the current RuntimeSnapshot. */
    readSnapshot(): RuntimeSnapshot;
    /** Initialize a fresh state directory. */
    initStateDir(dir: string): void;
    /** Read a Rust-authored compatibility file as typed JSON. */
    readCompatFile<T>(filename: string): T | null;
    /** Read authority snapshot from compatibility file. */
    readAuthority(): AuthoritySnapshot | null;
    /** Read readiness snapshot from compatibility file. */
    readReadiness(): ReadinessSnapshot | null;
    /** Read backlog snapshot from compatibility file. */
    readBacklog(): BacklogSnapshot | null;
    /**
     * Read dispatch records from compatibility file.
     * Transforms Rust format ({ records: [...] }) to flat array,
     * and maps `target` → `to_worker` + merges metadata fields.
     */
    readDispatchRecords(): DispatchRecord[];
    /** Read mailbox records from compatibility file. */
    readMailboxRecords(): MailboxRecord[];
    private validateSchemaOnce;
    private run;
}
export declare function getDefaultBridge(stateDir?: string): RuntimeBridge;
export declare function isBridgeEnabled(): boolean;
//# sourceMappingURL=bridge.d.ts.map