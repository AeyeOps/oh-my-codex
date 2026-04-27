import { type DispatchRecord } from '../../runtime/bridge.js';
import { type TeamReminderIntent } from '../reminder-intents.js';
import { type TeamDispatchRequestStatus } from '../contracts.js';
export type TeamDispatchRequestKind = 'inbox' | 'mailbox' | 'nudge';
export type TeamDispatchTransportPreference = 'hook_preferred_with_fallback' | 'transport_direct' | 'prompt_stdin';
export interface TeamDispatchRequest {
    request_id: string;
    kind: TeamDispatchRequestKind;
    team_name: string;
    to_worker: string;
    worker_index?: number;
    pane_id?: string;
    trigger_message: string;
    intent?: TeamReminderIntent;
    message_id?: string;
    inbox_correlation_key?: string;
    transport_preference: TeamDispatchTransportPreference;
    fallback_allowed: boolean;
    status: TeamDispatchRequestStatus;
    attempt_count: number;
    created_at: string;
    updated_at: string;
    notified_at?: string;
    delivered_at?: string;
    failed_at?: string;
    last_reason?: string;
}
export interface TeamDispatchRequestInput {
    kind: TeamDispatchRequestKind;
    to_worker: string;
    worker_index?: number;
    pane_id?: string;
    trigger_message: string;
    intent?: TeamReminderIntent;
    message_id?: string;
    inbox_correlation_key?: string;
    transport_preference?: TeamDispatchTransportPreference;
    fallback_allowed?: boolean;
    last_reason?: string;
}
interface DispatchDeps {
    teamName: string;
    cwd: string;
    validateWorkerName: (name: string) => void;
    withDispatchLock: <T>(teamName: string, cwd: string, fn: () => Promise<T>) => Promise<T>;
    readDispatchRequests: (teamName: string, cwd: string) => Promise<TeamDispatchRequest[]>;
    writeDispatchRequests: (teamName: string, requests: TeamDispatchRequest[], cwd: string) => Promise<void>;
}
export declare function normalizeDispatchRequest(teamName: string, raw: Partial<TeamDispatchRequest>, nowIso?: string): TeamDispatchRequest | null;
export declare function normalizeBridgeDispatchRecord(teamName: string, record: DispatchRecord, nowIso?: string): TeamDispatchRequest | null;
export declare function enqueueDispatchRequest(requestInput: TeamDispatchRequestInput, deps: DispatchDeps): Promise<{
    request: TeamDispatchRequest;
    deduped: boolean;
}>;
export declare function listDispatchRequests(opts: {
    status?: TeamDispatchRequestStatus;
    kind?: TeamDispatchRequestKind;
    to_worker?: string;
    limit?: number;
} | undefined, deps: DispatchDeps): Promise<TeamDispatchRequest[]>;
export declare function readDispatchRequest(requestId: string, deps: DispatchDeps): Promise<TeamDispatchRequest | null>;
export declare function transitionDispatchRequest(requestId: string, from: TeamDispatchRequestStatus, to: TeamDispatchRequestStatus, patch: Partial<TeamDispatchRequest> | undefined, deps: DispatchDeps): Promise<TeamDispatchRequest | null>;
export declare function markDispatchRequestNotified(requestId: string, patch: Partial<TeamDispatchRequest> | undefined, deps: DispatchDeps): Promise<TeamDispatchRequest | null>;
export declare function markDispatchRequestDelivered(requestId: string, patch: Partial<TeamDispatchRequest> | undefined, deps: DispatchDeps): Promise<TeamDispatchRequest | null>;
export declare function markDispatchRequestFailed(requestId: string, reason: string, deps: DispatchDeps): Promise<void>;
export {};
//# sourceMappingURL=dispatch.d.ts.map