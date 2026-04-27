/**
 * Triage State
 *
 * Session-scoped state helper for prompt-routing triage.
 * Independent of workflow mode state (ralph-state.json, skill-active-state.json, etc.).
 *
 * File location:
 *   With session id : .omx/state/sessions/<session_id>/prompt-routing-state.json
 *   Without session id: .omx/state/prompt-routing-state.json
 *
 * Rules:
 *   - Write ONLY for HEAVY/LIGHT decisions (never for PASS).
 *   - Keyword routing must not write triage state (caller's responsibility).
 *   - Missing or malformed file returns null from readTriageState, never throws.
 */
export interface TriageStateFile {
    version: 1;
    last_triage: {
        lane: "HEAVY" | "LIGHT";
        destination: "autopilot" | "explore" | "executor" | "designer" | "researcher";
        reason: string;
        /** sha256 of the normalized prompt, prefixed with "sha256:" */
        prompt_signature: string;
        /** Best-effort turn marker; ISO timestamp or monotonic counter */
        turn_id: string;
        /** ISO timestamp */
        created_at: string;
    } | null;
    suppress_followup: boolean;
}
export interface ReadTriageStateArgs {
    sessionId?: string | null;
    cwd?: string;
}
export declare function readTriageState(args: ReadTriageStateArgs): TriageStateFile | null;
export interface WriteTriageStateArgs extends ReadTriageStateArgs {
    state: TriageStateFile;
}
export declare function writeTriageState(args: WriteTriageStateArgs): void;
/**
 * Returns a sha256 hex digest of the normalized prompt, prefixed with "sha256:".
 */
export declare function promptSignature(normalizedPrompt: string): string;
export interface ShouldSuppressArgs {
    previous: TriageStateFile | null;
    /** Normalized prompt: trim + lowercase */
    currentPrompt: string;
    /** Keyword routing always bypasses suppression */
    currentHasKeyword: boolean;
}
/**
 * Returns true when the current prompt should suppress triage re-injection
 * because it looks like a short follow-up to a prior HEAVY/LIGHT triage turn.
 *
 * Suppression conditions (all must hold):
 *   1. A prior triage exists (previous?.last_triage != null).
 *   2. previous.suppress_followup === true.
 *   3. currentHasKeyword === false (keywords always bypass triage).
 *   4. The current prompt looks like a clarifying reply and starts with a
 *      known clarifying token. Short length alone is not enough.
 */
export declare function shouldSuppressFollowup(args: ShouldSuppressArgs): boolean;
//# sourceMappingURL=triage-state.d.ts.map