import { type TeamReasoningEffort } from './model-contract.js';
export type FollowupMode = 'team' | 'ralph';
export interface FollowupAllocation {
    role: string;
    count: number;
    reason: string;
    reasoningEffort?: TeamReasoningEffort;
}
export interface FollowupLaunchHints {
    shellCommand: string;
    skillCommand: string;
    rationale: string;
}
export interface FollowupVerificationPlan {
    summary: string;
    checkpoints: string[];
}
export interface FollowupStaffingPlan {
    mode: FollowupMode;
    availableAgentTypes: string[];
    recommendedHeadcount: number;
    allocations: FollowupAllocation[];
    rosterSummary: string;
    staffingSummary: string;
    launchHints: FollowupLaunchHints;
    verificationPlan: FollowupVerificationPlan;
}
export interface ResolveAvailableAgentTypesOptions {
    promptDirs?: string[];
}
export interface BuildFollowupStaffingPlanOptions {
    workerCount?: number;
    fallbackRole?: string;
}
export interface ApprovedExecutionFollowupContext {
    planningComplete?: boolean;
    priorSkill?: string | null;
}
export declare function isShortTeamFollowupRequest(text: string): boolean;
export declare function isShortRalphFollowupRequest(text: string): boolean;
export declare function isApprovedExecutionFollowupShortcut(mode: FollowupMode, text: string, context?: ApprovedExecutionFollowupContext): boolean;
export declare function resolveAvailableAgentTypes(projectRoot: string, options?: ResolveAvailableAgentTypesOptions): Promise<string[]>;
export declare function buildFollowupStaffingPlan(mode: FollowupMode, task: string, availableAgentTypes: readonly string[], options?: BuildFollowupStaffingPlanOptions): FollowupStaffingPlan;
//# sourceMappingURL=followup-planner.d.ts.map