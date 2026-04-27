import { randomUUID } from 'crypto';
import { getDefaultBridge, isBridgeEnabled, resolveBridgeStateDir } from '../../runtime/bridge.js';
import { appendTeamDeliveryLogForCwd } from '../delivery-log.js';
function executeBridgeCommand(cwd, command) {
    if (!isBridgeEnabled())
        return false;
    try {
        getDefaultBridge(resolveBridgeStateDir(cwd)).execCommand(command);
        return true;
    }
    catch {
        return false;
    }
}
export function normalizeBridgeMailboxMessage(record) {
    return {
        message_id: record.message_id,
        from_worker: record.from_worker,
        to_worker: record.to_worker,
        body: record.body,
        created_at: record.created_at,
        notified_at: record.notified_at ?? undefined,
        delivered_at: record.delivered_at ?? undefined,
    };
}
export async function sendDirectMessage(fromWorker, toWorker, body, deps) {
    let created = false;
    let msg = null;
    let creationTransport = 'legacy-json';
    await deps.withMailboxLock(deps.teamName, toWorker, deps.cwd, async () => {
        const mailbox = await deps.readMailbox(deps.teamName, toWorker, deps.cwd);
        const legacyMailbox = deps.readLegacyMailbox
            ? await deps.readLegacyMailbox(deps.teamName, toWorker, deps.cwd)
            : mailbox;
        const dedupeCandidates = [...mailbox.messages];
        if (deps.readLegacyMailbox) {
            const seenMessageIds = new Set(dedupeCandidates.map((candidate) => candidate.message_id));
            for (const legacyMessage of legacyMailbox.messages) {
                if (!seenMessageIds.has(legacyMessage.message_id)) {
                    dedupeCandidates.push(legacyMessage);
                    seenMessageIds.add(legacyMessage.message_id);
                }
            }
        }
        const existing = dedupeCandidates.find((candidate) => candidate.from_worker === fromWorker
            && candidate.to_worker === toWorker
            && candidate.body === body
            && !candidate.delivered_at);
        if (existing) {
            msg = existing;
            return;
        }
        const msgId = randomUUID();
        if (executeBridgeCommand(deps.cwd, {
            command: 'CreateMailboxMessage',
            message_id: msgId,
            from_worker: fromWorker,
            to_worker: toWorker,
            body,
        })) {
            const bridgeMailbox = await deps.readMailbox(deps.teamName, toWorker, deps.cwd);
            const bridgeMessage = bridgeMailbox.messages.find((candidate) => candidate.message_id === msgId);
            if (bridgeMessage) {
                creationTransport = 'bridge';
                msg = {
                    ...bridgeMessage,
                    body: bridgeMessage.body || body,
                };
                const shadowMailbox = {
                    worker: legacyMailbox.worker,
                    messages: [...legacyMailbox.messages],
                };
                const shadowIndex = shadowMailbox.messages.findIndex((candidate) => candidate.message_id === msgId);
                if (shadowIndex >= 0)
                    shadowMailbox.messages[shadowIndex] = msg;
                else
                    shadowMailbox.messages.push(msg);
                await deps.writeMailbox(deps.teamName, shadowMailbox, deps.cwd);
                created = true;
                return;
            }
        }
        msg = {
            message_id: msgId,
            from_worker: fromWorker,
            to_worker: toWorker,
            body,
            created_at: new Date().toISOString(),
        };
        const shadowMailbox = {
            worker: legacyMailbox.worker,
            messages: [...legacyMailbox.messages, msg],
        };
        await deps.writeMailbox(deps.teamName, shadowMailbox, deps.cwd);
        created = true;
    });
    if (!msg) {
        throw new Error('failed_to_persist_mailbox_message');
    }
    const persistedMessage = msg;
    if (created) {
        await deps.appendTeamEvent(deps.teamName, { type: 'message_received', worker: toWorker, task_id: undefined, message_id: persistedMessage.message_id, reason: undefined }, deps.cwd);
        await appendTeamDeliveryLogForCwd(deps.cwd, {
            event: 'mailbox_created',
            source: 'team.state.mailbox',
            team: deps.teamName,
            message_id: persistedMessage.message_id,
            from_worker: fromWorker,
            to_worker: toWorker,
            transport: creationTransport,
            result: 'created',
        });
    }
    return persistedMessage;
}
export async function broadcastMessage(fromWorker, body, deps) {
    const cfg = await deps.readTeamConfig(deps.teamName, deps.cwd);
    if (!cfg)
        throw new Error(`Team ${deps.teamName} not found`);
    const delivered = [];
    for (const target of cfg.workers.map((w) => w.name)) {
        if (target === fromWorker)
            continue;
        delivered.push(await sendDirectMessage(fromWorker, target, body, deps));
    }
    return delivered;
}
export async function markMessageDelivered(workerName, messageId, deps) {
    const existingMailbox = await deps.readMailbox(deps.teamName, workerName, deps.cwd);
    const existingMessage = existingMailbox.messages.find((message) => message.message_id === messageId);
    if (!existingMessage)
        return false;
    if (existingMessage.delivered_at)
        return true;
    if (executeBridgeCommand(deps.cwd, { command: 'MarkMailboxDelivered', message_id: messageId })) {
        const updated = await deps.withMailboxLock(deps.teamName, workerName, deps.cwd, async () => {
            const mailbox = await deps.readMailbox(deps.teamName, workerName, deps.cwd);
            const msg = mailbox.messages.find((message) => message.message_id === messageId);
            if (!msg)
                return false;
            if (!msg.delivered_at) {
                msg.delivered_at = new Date().toISOString();
                await deps.writeMailbox(deps.teamName, mailbox, deps.cwd);
            }
            else {
                await deps.writeMailbox(deps.teamName, mailbox, deps.cwd);
            }
            return true;
        });
        if (updated) {
            await appendTeamDeliveryLogForCwd(deps.cwd, {
                event: 'delivered',
                source: 'team.state.mailbox',
                team: deps.teamName,
                message_id: messageId,
                to_worker: workerName,
                transport: 'bridge',
                result: 'updated',
            });
        }
        return updated;
    }
    const updated = await deps.withMailboxLock(deps.teamName, workerName, deps.cwd, async () => {
        const mailbox = await deps.readMailbox(deps.teamName, workerName, deps.cwd);
        const msg = mailbox.messages.find((m) => m.message_id === messageId);
        if (!msg)
            return false;
        if (!msg.delivered_at) {
            msg.delivered_at = new Date().toISOString();
            await deps.writeMailbox(deps.teamName, mailbox, deps.cwd);
        }
        return true;
    });
    if (updated) {
        await appendTeamDeliveryLogForCwd(deps.cwd, {
            event: 'delivered',
            source: 'team.state.mailbox',
            team: deps.teamName,
            message_id: messageId,
            to_worker: workerName,
            transport: 'legacy-json',
            result: 'updated',
        });
    }
    return updated;
}
export async function markMessageNotified(workerName, messageId, deps) {
    if (executeBridgeCommand(deps.cwd, { command: 'MarkMailboxNotified', message_id: messageId })) {
        return await deps.withMailboxLock(deps.teamName, workerName, deps.cwd, async () => {
            const mailbox = await deps.readMailbox(deps.teamName, workerName, deps.cwd);
            const msg = mailbox.messages.find((message) => message.message_id === messageId);
            if (!msg)
                return false;
            msg.notified_at = new Date().toISOString();
            await deps.writeMailbox(deps.teamName, mailbox, deps.cwd);
            return true;
        });
    }
    return await deps.withMailboxLock(deps.teamName, workerName, deps.cwd, async () => {
        const mailbox = await deps.readMailbox(deps.teamName, workerName, deps.cwd);
        const msg = mailbox.messages.find((m) => m.message_id === messageId);
        if (!msg)
            return false;
        msg.notified_at = new Date().toISOString();
        await deps.writeMailbox(deps.teamName, mailbox, deps.cwd);
        return true;
    });
}
export async function listMailboxMessages(workerName, deps) {
    const mailbox = await deps.readMailbox(deps.teamName, workerName, deps.cwd);
    return mailbox.messages;
}
//# sourceMappingURL=mailbox.js.map