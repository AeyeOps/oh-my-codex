import { type TeamDispatchRequest, type TeamDispatchRequestInput } from './team-ops.js';
import type { TeamReminderIntent } from './reminder-intents.js';
export interface TeamNotifierTarget {
    workerName: string;
    workerIndex?: number;
    paneId?: string;
}
export type DispatchTransport = 'hook' | 'prompt_stdin' | 'tmux_send_keys' | 'mailbox' | 'none';
export interface DispatchOutcome {
    ok: boolean;
    transport: DispatchTransport;
    reason: string;
    request_id?: string;
    message_id?: string;
    to_worker?: string;
}
export type TeamNotifier = (target: TeamNotifierTarget, message: string, context: {
    request: TeamDispatchRequest;
    message_id?: string;
}) => DispatchOutcome | Promise<DispatchOutcome>;
interface QueueInboxParams {
    teamName: string;
    workerName: string;
    workerIndex: number;
    paneId?: string;
    inbox: string;
    triggerMessage: string;
    intent?: TeamReminderIntent;
    cwd: string;
    transportPreference?: TeamDispatchRequestInput['transport_preference'];
    fallbackAllowed?: boolean;
    inboxCorrelationKey?: string;
    notify: TeamNotifier;
}
export declare function queueInboxInstruction(params: QueueInboxParams): Promise<DispatchOutcome>;
interface QueueDirectMessageParams {
    teamName: string;
    fromWorker: string;
    toWorker: string;
    toWorkerIndex?: number;
    toPaneId?: string;
    body: string;
    triggerMessage: string;
    intent?: TeamReminderIntent;
    cwd: string;
    transportPreference?: TeamDispatchRequestInput['transport_preference'];
    fallbackAllowed?: boolean;
    notify: TeamNotifier;
}
export declare function queueDirectMailboxMessage(params: QueueDirectMessageParams): Promise<DispatchOutcome>;
interface QueueBroadcastParams {
    teamName: string;
    fromWorker: string;
    recipients: Array<{
        workerName: string;
        workerIndex: number;
        paneId?: string;
    }>;
    body: string;
    cwd: string;
    triggerFor: (workerName: string) => string;
    intentFor?: (workerName: string) => TeamReminderIntent;
    transportPreference?: TeamDispatchRequestInput['transport_preference'];
    fallbackAllowed?: boolean;
    notify: TeamNotifier;
}
export declare function queueBroadcastMailboxMessage(params: QueueBroadcastParams): Promise<DispatchOutcome[]>;
export declare function waitForDispatchReceipt(teamName: string, requestId: string, cwd: string, options: {
    timeoutMs: number;
    pollMs?: number;
}): Promise<TeamDispatchRequest | null>;
export {};
//# sourceMappingURL=mcp-comm.d.ts.map