import { type MailboxRecord } from '../../runtime/bridge.js';
export interface TeamMailboxMessage {
    message_id: string;
    from_worker: string;
    to_worker: string;
    body: string;
    created_at: string;
    notified_at?: string;
    delivered_at?: string;
}
export interface TeamMailbox {
    worker: string;
    messages: TeamMailboxMessage[];
}
interface MailboxDeps {
    teamName: string;
    cwd: string;
    withMailboxLock: <T>(teamName: string, workerName: string, cwd: string, fn: () => Promise<T>) => Promise<T>;
    readMailbox: (teamName: string, workerName: string, cwd: string) => Promise<TeamMailbox>;
    readLegacyMailbox?: (teamName: string, workerName: string, cwd: string) => Promise<TeamMailbox>;
    writeMailbox: (teamName: string, mailbox: TeamMailbox, cwd: string) => Promise<void>;
    appendTeamEvent: (teamName: string, event: {
        type: 'message_received';
        worker: string;
        task_id?: string;
        message_id?: string | null;
        reason?: string;
    }, cwd: string) => Promise<unknown>;
    readTeamConfig: (teamName: string, cwd: string) => Promise<{
        workers: Array<{
            name: string;
        }>;
    } | null>;
}
export declare function normalizeBridgeMailboxMessage(record: MailboxRecord): TeamMailboxMessage;
export declare function sendDirectMessage(fromWorker: string, toWorker: string, body: string, deps: MailboxDeps): Promise<TeamMailboxMessage>;
export declare function broadcastMessage(fromWorker: string, body: string, deps: MailboxDeps): Promise<TeamMailboxMessage[]>;
export declare function markMessageDelivered(workerName: string, messageId: string, deps: MailboxDeps): Promise<boolean>;
export declare function markMessageNotified(workerName: string, messageId: string, deps: MailboxDeps): Promise<boolean>;
export declare function listMailboxMessages(workerName: string, deps: MailboxDeps): Promise<TeamMailboxMessage[]>;
export {};
//# sourceMappingURL=mailbox.d.ts.map