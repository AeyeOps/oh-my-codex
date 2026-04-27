/**
 * Consensus mode execution handoff regression tests
 *
 * Verifies that the plan skill's consensus mode (ralplan) mandates:
 * 1. Structured AskUserQuestion for approval (not plain text)
 * 2. Explicit $ralph invocation on approval
 * 3. Prohibition of direct implementation from the planning agent
 * 4. User feedback step after Planner but before Architect/Critic
 * 5. RALPLAN-DR short mode and deliberate mode requirements
 *
 * Also verifies non-consensus modes (interview, direct, review) are unaffected,
 * and that architect/critic prompts contain required RALPLAN-DR sections.
 *
 * Note: This file loads SKILL.md and prompt content directly via fs.readFileSync()
 * instead of getBuiltinSkill() (which does not exist in OMX).
 */
export {};
//# sourceMappingURL=consensus-execution-handoff.test.d.ts.map