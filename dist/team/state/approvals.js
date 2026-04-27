import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
export async function writeTaskApproval(approval, deps) {
    const p = deps.approvalPath(deps.teamName, approval.task_id, deps.cwd);
    await deps.writeAtomic(p, JSON.stringify(approval, null, 2));
    await deps.appendTeamEvent(deps.teamName, {
        type: 'approval_decision',
        worker: approval.reviewer,
        task_id: approval.task_id,
        message_id: null,
        reason: `${approval.status}:${approval.decision_reason}`,
    }, deps.cwd);
}
export async function readTaskApproval(taskId, deps) {
    const p = deps.approvalPath(deps.teamName, taskId, deps.cwd);
    if (!existsSync(p))
        return null;
    try {
        const raw = await readFile(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.task_id !== taskId)
            return null;
        if (!['pending', 'approved', 'rejected'].includes(parsed.status))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=approvals.js.map