export interface AllocationTaskInput {
    subject: string;
    description: string;
    role?: string;
    blocked_by?: string[];
    filePaths?: string[];
    domains?: string[];
}
export interface AllocationWorkerInput {
    name: string;
    role?: string;
}
export interface AllocationDecision {
    owner: string;
    reason: string;
}
export declare function chooseTaskOwner(task: AllocationTaskInput, workers: AllocationWorkerInput[], currentAssignments: Array<{
    owner: string;
    role?: string;
    subject?: string;
    description?: string;
    filePaths?: string[];
    domains?: string[];
}>): AllocationDecision;
export declare function allocateTasksToWorkers<T extends AllocationTaskInput>(tasks: T[], workers: AllocationWorkerInput[]): Array<T & {
    owner: string;
    allocation_reason: string;
}>;
//# sourceMappingURL=allocation-policy.d.ts.map