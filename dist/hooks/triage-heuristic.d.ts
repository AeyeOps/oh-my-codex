/**
 * Triage Heuristic
 *
 * Pure, synchronous classifier for a 3-lane prompt triage system.
 * Advisory-only — never activates workflows, never touches state or fs.
 *
 * Lanes:
 *   PASS  — trivial acknowledgements, explicit opt-out phrases, or ambiguous short prompts
 *   LIGHT — single-agent destination: explore | executor | designer | researcher
 *   HEAVY — autopilot; longer goal-shaped imperative prompts
 */
export type TriageLane = "HEAVY" | "LIGHT" | "PASS";
export type LightDestination = "explore" | "executor" | "designer" | "researcher";
export interface TriageDecision {
    lane: TriageLane;
    destination?: LightDestination | "autopilot";
    reason: string;
}
export declare function triagePrompt(prompt: string): TriageDecision;
//# sourceMappingURL=triage-heuristic.d.ts.map