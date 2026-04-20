# OMX effort harness safety-boundary audit — 2026-04-20

## Scope

Task 3 review/deslop/evidence audit for the global OMX anti-minimum-effort harness.
This audit is intentionally non-invasive: it records the current gap surface and verification evidence without editing shared implementation files owned by the implementation/test lanes.

## Findings

1. **Core shared guidance still carries the weaker compactness framing**
   - `docs/prompt-guidance-fragments/core-operating-principles.md:1-4`
   - `templates/AGENTS.md:39-42`
   - `src/hooks/prompt-guidance-contract.ts:11-18`
   These surfaces still anchor on `compact, information-dense` / `concise and evidence-dense` wording instead of the PRD's stronger `quality-first`, anti-optionalizing, and evidence-before-stop guidance.

2. **The safety boundary is not yet enforced across the audited global surfaces**
   - `docs/prompt-guidance-fragments/core-operating-principles.md:2`
   - `src/config/generator.ts:82-86`
   - `src/agents/native-config.ts:20-55`
   The exact escalation boundary `destructive / irreversible / side-effectful / materially branching` is not yet consistently propagated through setup-level developer instructions or native-agent overlays.

3. **Native/config surfaces still emphasize posture, not explicit authority/evidence rules**
   - `src/config/generator.ts:86`
   - `src/agents/native-config.ts:24-29`
   - `src/agents/native-config.ts:36-40`
   Setup and generated native prompts currently reinforce orchestration/posture and verification, but they do not yet explicitly state that safe reversible work is already authorized after a direct request or that agents must avoid unnecessary permission filler.

4. **Focused contract evidence is partially masked by team-worker runtime state**
   - Running prompt-guidance contract tests from this team worker worktree reads the worker-runtime `AGENTS.md`, not the canonical repo-root template surface.
   - Result: targeted dist tests fail only on `agents-root` because this worktree root is a generated team-worker overlay, while the same targeted run passes the template surface and all prompt/skill/native/generator checks.

## Verification evidence

### PASS
- `npm run build`
  - Result: `tsc` completed successfully.
- `npm run lint -- docs/qa/omx-effort-harness-safety-audit-2026-04-20.md`
  - Result: Biome completed without reporting issues for the audit report.

### FAIL / notable evidence
- `node --test dist/hooks/__tests__/prompt-guidance-contract.test.js dist/hooks/__tests__/prompt-guidance-wave-two.test.js dist/hooks/__tests__/prompt-guidance-catalog.test.js dist/hooks/__tests__/prompt-guidance-scenarios.test.js dist/hooks/__tests__/skill-guidance-contract.test.js dist/config/__tests__/generator-notify.test.js dist/agents/__tests__/native-config.test.js`
  - Result: `63 pass / 1 fail`.
  - Failing case: `prompt guidance contract -> agents-root satisfies the core prompt-guidance contract`.
  - Failure mode: the assertion reads this worker worktree's runtime `AGENTS.md`, which contains the generated team-worker overlay rather than the canonical repo-root prompt contract surface.
- `npm test -- src/hooks/__tests__/prompt-guidance-contract.test.ts src/hooks/__tests__/prompt-guidance-wave-two.test.ts src/hooks/__tests__/prompt-guidance-catalog.test.ts src/hooks/__tests__/prompt-guidance-scenarios.test.ts src/hooks/__tests__/skill-guidance-contract.test.ts src/config/__tests__/generator-notify.test.ts src/agents/__tests__/native-config.test.ts`
  - Result: full repo test pipeline ran and ended with existing failures outside this audit lane.
  - Observed unrelated examples from output: `dist/cli/__tests__/team.test.js` failures in `teamCommand status` JSON pane id expectations and linked Ralph team-launch coverage.

## Recommendations for integration lane

1. Update the global shared fragments and contract patterns first so the guidance matches the PRD/test-spec language.
2. Propagate the exact safety boundary into `src/config/generator.ts` and `src/agents/native-config.ts`.
3. When verifying from team worktrees, avoid treating the worker-runtime root `AGENTS.md` as the canonical repo-root contract surface, or run the root-surface contract check from the leader checkout.
