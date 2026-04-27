import { type WorktreeMode } from '../team/worktree.js';
interface TeamCliOptions {
    verbose?: boolean;
}
interface ParsedTeamArgs {
    workerCount: number;
    agentType: string;
    explicitAgentType: boolean;
    explicitWorkerCount: boolean;
    task: string;
    teamName: string;
}
export interface ParsedTeamStartArgs {
    parsed: ParsedTeamArgs;
    worktreeMode: WorktreeMode;
}
export declare function parseTeamStartArgs(args: string[]): ParsedTeamStartArgs;
export interface TeamExecutionPlan {
    workerCount: number;
    tasks: Array<{
        subject: string;
        description: string;
        owner: string;
        role?: string;
    }>;
}
export declare function buildTeamExecutionPlan(task: string, workerCount: number, agentType: string, explicitAgentType: boolean, explicitWorkerCount?: boolean): TeamExecutionPlan;
export declare function decomposeTaskString(task: string, workerCount: number, agentType: string, explicitAgentType: boolean, explicitWorkerCount?: boolean): Array<{
    subject: string;
    description: string;
    owner: string;
    role?: string;
}>;
export declare function buildLeaderMonitoringHints(teamName: string): string[];
export declare function teamCommand(args: string[], _options?: TeamCliOptions): Promise<void>;
export {};
//# sourceMappingURL=team.d.ts.map