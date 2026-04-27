export interface TaskApprovalRecord {
    task_id: string;
    required: boolean;
    status: 'pending' | 'approved' | 'rejected';
    reviewer: string;
    decision_reason: string;
    decided_at: string;
}
interface ApprovalDeps {
    teamName: string;
    cwd: string;
    approvalPath: (teamName: string, taskId: string, cwd: string) => string;
    writeAtomic: (filePath: string, data: string) => Promise<void>;
    appendTeamEvent: (teamName: string, event: {
        type: 'approval_decision';
        worker: string;
        task_id?: string;
        message_id?: string | null;
        reason?: string;
    }, cwd: string) => Promise<unknown>;
}
export declare function writeTaskApproval(approval: TaskApprovalRecord, deps: ApprovalDeps): Promise<void>;
export declare function readTaskApproval(taskId: string, deps: ApprovalDeps): Promise<TaskApprovalRecord | null>;
export {};
//# sourceMappingURL=approvals.d.ts.map