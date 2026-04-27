import { type NotifyCanonicalActiveTeam } from '../scripts/notify-hook/active-team.js';
export interface QuestionPolicyDecision {
    allowed: boolean;
    sessionId?: string;
    code?: 'worker_blocked' | 'team_blocked' | 'active_execution_mode_blocked';
    message?: string;
    fallbackAllowed?: boolean;
    activeModes: string[];
    activeSkills: string[];
    activeTeams: NotifyCanonicalActiveTeam[];
}
export interface EvaluateQuestionPolicyOptions {
    cwd: string;
    explicitSessionId?: string;
    env?: NodeJS.ProcessEnv;
}
export declare function evaluateQuestionPolicy(options: EvaluateQuestionPolicyOptions): Promise<QuestionPolicyDecision>;
//# sourceMappingURL=policy.d.ts.map