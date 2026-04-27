/**
 * Keyword Detection Engine
 *
 * In OMC/legacy OMX flows, this logic detects workflow keywords and can inject
 * prompt-side routing guidance.
 *
 * In current OMX, native `UserPromptSubmit` is the canonical execution surface:
 * this module owns the keyword registry, runtime gating, and hook-seeded
 * skill/workflow state. AGENTS.md now carries the behavioral fallback contract
 * rather than the full keyword/state table.
 */
import { type TaskSizeResult } from './task-size-detector.js';
import { type SkillActiveEntry } from '../state/skill-active.js';
import { type DeepInterviewQuestionEnforcementState } from '../question/deep-interview.js';
export interface KeywordMatch {
    keyword: string;
    skill: string;
    priority: number;
}
export type SkillActivePhase = 'planning' | 'executing' | 'reviewing' | 'completing';
export interface DeepInterviewInputLock {
    active: boolean;
    scope: 'deep-interview-auto-approval';
    acquired_at: string;
    released_at?: string;
    exit_reason?: 'success' | 'error' | 'abort' | 'handoff';
    blocked_inputs: string[];
    message: string;
}
export interface SkillActiveState {
    version: 1;
    active: boolean;
    skill: string;
    keyword: string;
    phase: string;
    activated_at: string;
    updated_at: string;
    source: 'keyword-detector';
    session_id?: string;
    thread_id?: string;
    turn_id?: string;
    input_lock?: DeepInterviewInputLock;
    active_skills?: SkillActiveEntry[];
    initialized_mode?: string;
    initialized_state_path?: string;
    transition_error?: string;
    transition_message?: string;
    transition_messages?: string[];
    requested_skills?: string[];
    deferred_skills?: string[];
    [key: string]: unknown;
}
export interface RecordSkillActivationInput {
    stateDir: string;
    text: string;
    sessionId?: string;
    threadId?: string;
    turnId?: string;
    nowIso?: string;
}
export interface DeepInterviewModeStatePersistenceInput {
    sessionId?: string;
    threadId?: string;
    turnId?: string;
}
export declare const DEEP_INTERVIEW_STATE_FILE = "deep-interview-state.json";
export declare const DEEP_INTERVIEW_BLOCKED_APPROVAL_INPUTS: readonly ["yes", "y", "proceed", "continue", "ok", "sure", "go ahead", "next i should"];
export declare const DEEP_INTERVIEW_INPUT_LOCK_MESSAGE = "Deep interview is active; auto-approval shortcuts are blocked until the interview finishes.";
export interface DeepInterviewModeState {
    active: boolean;
    mode: 'deep-interview';
    tmux_pane_id?: string;
    tmux_pane_set_at?: string;
    current_phase: string;
    started_at: string;
    updated_at: string;
    completed_at?: string;
    session_id?: string;
    thread_id?: string;
    turn_id?: string;
    input_lock?: DeepInterviewInputLock;
    question_enforcement?: DeepInterviewQuestionEnforcementState;
    [key: string]: unknown;
}
export declare function persistDeepInterviewModeState(stateDir: string, nextSkill: SkillActiveState | null, nowIso: string, previousSkill: SkillActiveState | null, input: DeepInterviewModeStatePersistenceInput): Promise<void>;
/**
 * Detect keywords in user input text
 * Returns explicit `$skill` matches first (left-to-right),
 * then appends implicit keyword matches sorted by priority.
 */
export declare function detectKeywords(text: string): KeywordMatch[];
/**
 * Get the highest-priority keyword match
 */
export declare function detectPrimaryKeyword(text: string): KeywordMatch | null;
export declare function recordSkillActivation(input: RecordSkillActivationInput): Promise<SkillActiveState | null>;
/**
 * Pre-execution gate — ported from OMC src/hooks/keyword-detector/index.ts
 *
 * In OMC these functions run at prompt time in bridge.ts (mandatory enforcement).
 * In OMX they generate AGENTS.md instructions and serve as test infrastructure.
 * See task-size-detector.ts for full advisory-nature documentation.
 */
/**
 * Execution mode keywords subject to the ralplan-first gate.
 * These modes spin up heavy orchestration and should not run on vague requests.
 */
export declare const EXECUTION_GATE_KEYWORDS: Set<string>;
/**
 * Escape hatch prefixes that bypass the ralplan gate.
 */
export declare const GATE_BYPASS_PREFIXES: string[];
/**
 * Positive signals that the prompt IS well-specified enough for direct execution.
 * If ANY of these are present, the prompt auto-passes the gate (fast path).
 */
export declare const WELL_SPECIFIED_SIGNALS: RegExp[];
/**
 * Check if a prompt is underspecified for direct execution.
 * Returns true if the prompt lacks enough specificity for heavy execution modes.
 *
 * Conservative: only gates clearly vague prompts. Borderline cases pass through.
 */
export declare function isUnderspecifiedForExecution(text: string): boolean;
/**
 * Apply the ralplan-first gate: if execution keywords are present
 * but the prompt is underspecified, redirect to ralplan.
 *
 * Returns the modified keyword list and gate metadata.
 */
export interface ApplyRalplanGateOptions {
    cwd?: string;
    priorSkill?: string | null;
}
export declare function applyRalplanGate(keywords: string[], text: string, options?: ApplyRalplanGateOptions): {
    keywords: string[];
    gateApplied: boolean;
    gatedKeywords: string[];
};
/**
 * Options for task-size-aware keyword filtering
 */
export interface TaskSizeFilterOptions {
    /** Enable task-size detection. Default: true */
    enabled?: boolean;
    /** Word count threshold for small tasks. Default: 50 */
    smallWordLimit?: number;
    /** Word count threshold for large tasks. Default: 200 */
    largeWordLimit?: number;
    /** Suppress heavy modes for small tasks. Default: true */
    suppressHeavyModesForSmallTasks?: boolean;
}
/**
 * Get all keywords with task-size-based filtering applied.
 * For small tasks, heavy orchestration modes (ralph/autopilot/team/ultrawork etc.)
 * are suppressed to avoid over-orchestration.
 */
export declare function getAllKeywordsWithSizeCheck(text: string, options?: TaskSizeFilterOptions): {
    keywords: string[];
    taskSizeResult: TaskSizeResult | null;
    suppressedKeywords: string[];
};
//# sourceMappingURL=keyword-detector.d.ts.map