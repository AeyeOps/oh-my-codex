/**
 * Auto-nudge: detect Codex "asking for permission" stall patterns and
 * automatically send a continuation prompt so the agent keeps working.
 */
export declare const SKILL_ACTIVE_STATE_FILE = "skill-active-state.json";
export declare const DEEP_INTERVIEW_BLOCKED_APPROVAL_INPUTS: string[];
export declare const DEEP_INTERVIEW_INPUT_LOCK_MESSAGE = "Deep interview is active; auto-approval shortcuts are blocked until the interview finishes.";
export declare const DEFAULT_AUTO_NUDGE_RESPONSE = "continue with the current task only if it is already authorized";
export declare function normalizeBlockedAutoApprovalInput(text: any): string;
export declare function isBlockedAutoApprovalInput(text: any, blockedInputs?: string[]): boolean;
export declare function isDeepInterviewAutoApprovalLocked(skillState: any): boolean;
export declare function inferDeepInterviewReleaseReason({ skillState, latestUserInput, lastMessage }: {
    skillState: any;
    latestUserInput?: string | undefined;
    lastMessage?: string | undefined;
}): "error" | "abort" | "success" | null;
export declare function normalizeSkillActiveState(raw: any): {
    version: number;
    active: boolean;
    skill: string;
    keyword: string;
    phase: string;
    activated_at: string;
    updated_at: string;
    source: string;
    input_lock: {
        active: boolean;
        scope: string;
        acquired_at: string;
        released_at: string;
        blocked_inputs: any;
        message: string;
        exit_reason: string;
    } | null;
} | null;
export declare function inferSkillPhaseFromText(text: any, currentPhase?: string): string;
export declare function syncSkillStateFromTurn(stateDir: any, payload: any): Promise<{
    invocationSessionId: string;
    skillState: null;
    releaseReason: null;
} | {
    invocationSessionId: string;
    skillState: {
        version: number;
        active: boolean;
        skill: string;
        keyword: string;
        phase: string;
        activated_at: string;
        updated_at: string;
        source: string;
        input_lock: {
            active: boolean;
            scope: string;
            acquired_at: string;
            released_at: string;
            blocked_inputs: any;
            message: string;
            exit_reason: string;
        } | null;
    };
    releaseReason: string | null;
}>;
export declare function isDeepInterviewStateActive(stateDir: any, sessionId: any): Promise<boolean>;
export declare function isDeepInterviewInputLockActive(stateDir: any, sessionId: any): Promise<boolean>;
export declare function resolveAutoNudgeSignature(stateDir: any, payload: any, lastMessage?: string): Promise<string>;
export declare const DEFAULT_STALL_PATTERNS: string[];
export declare function normalizeAutoNudgeSignatureText(text: any): string;
export declare function normalizeAutoNudgeConfig(raw: any): {
    enabled: boolean;
    patterns: any;
    response: any;
    delaySec: any;
    stallMs: any;
    ttlMs: any;
};
export declare function resolveEffectiveAutoNudgeResponse(response: any): string;
export declare function loadAutoNudgeConfig(): Promise<{
    enabled: boolean;
    patterns: any;
    response: any;
    delaySec: any;
    stallMs: any;
    ttlMs: any;
}>;
export declare function detectStallPattern(text: any, patterns: any, currentPhase?: string): boolean;
export declare function detectNativeStopStallPattern(text: any, patterns: any, currentPhase?: string): boolean;
export declare function capturePane(paneId: any, lines?: number): Promise<string>;
export declare function resolveNudgePaneTarget(stateDir: any, cwd?: string, payload?: any): Promise<string>;
export declare function maybeAutoNudge({ cwd, stateDir, logsDir, payload }: {
    cwd: any;
    stateDir: any;
    logsDir: any;
    payload: any;
}): Promise<void>;
//# sourceMappingURL=auto-nudge.d.ts.map