export declare const SKILL_ACTIVE_STATE_MODE = "skill-active";
export declare const SKILL_ACTIVE_STATE_FILE = "skill-active-state.json";
export declare const CANONICAL_WORKFLOW_SKILLS: readonly ["autopilot", "autoresearch", "team", "ralph", "ultrawork", "ultraqa", "ralplan", "deep-interview"];
export type CanonicalWorkflowSkill = (typeof CANONICAL_WORKFLOW_SKILLS)[number];
export interface SkillActiveEntry {
    skill: string;
    phase?: string;
    active?: boolean;
    activated_at?: string;
    updated_at?: string;
    session_id?: string;
    thread_id?: string;
    turn_id?: string;
}
export interface SkillActiveStateLike {
    version?: number;
    active?: boolean;
    skill?: string;
    keyword?: string;
    phase?: string;
    activated_at?: string;
    updated_at?: string;
    source?: string;
    session_id?: string;
    thread_id?: string;
    turn_id?: string;
    initialized_mode?: string;
    initialized_state_path?: string;
    input_lock?: unknown;
    active_skills?: SkillActiveEntry[];
    [key: string]: unknown;
}
export interface SyncCanonicalSkillStateOptions {
    cwd: string;
    mode: string;
    active: boolean;
    currentPhase?: string;
    sessionId?: string;
    threadId?: string;
    turnId?: string;
    nowIso?: string;
    source?: string;
}
export declare function listActiveSkills(raw: unknown): SkillActiveEntry[];
export declare function normalizeSkillActiveState(raw: unknown): SkillActiveStateLike | null;
export declare function getSkillActiveStatePaths(cwd: string, sessionId?: string): {
    rootPath: string;
    sessionPath?: string;
};
export declare function readSkillActiveState(path: string): Promise<SkillActiveStateLike | null>;
export declare function writeSkillActiveStateCopies(cwd: string, state: SkillActiveStateLike, sessionId?: string, rootState?: SkillActiveStateLike | null): Promise<void>;
export declare function readVisibleSkillActiveState(cwd: string, sessionId?: string): Promise<SkillActiveStateLike | null>;
export declare function tracksCanonicalWorkflowSkill(mode: string): mode is CanonicalWorkflowSkill;
export declare function syncCanonicalSkillStateForMode(options: SyncCanonicalSkillStateOptions): Promise<void>;
//# sourceMappingURL=skill-active.d.ts.map