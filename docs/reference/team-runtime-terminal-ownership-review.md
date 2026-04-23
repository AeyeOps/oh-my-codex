# Team Runtime Terminal Ownership Review

Date: 2026-04-23
Task: worker-3 review lane for `fix-team-runtime-orchestration`

## Scope

Review the current team runtime signals around terminal completion and document the remaining gap between:

- **task-terminal inference** (`all tasks are completed/failed`), and
- **explicit terminal ownership** (`the leader/runtime has intentionally decided to shut the team down`).

This note is evidence for the current branch state; it does not claim that the runtime contract is fully fixed by itself.

## Current behavior observed

### 1. `monitorTeam()` still derives terminal phase from task counts

`monitorTeam()` computes:

- `allTasksTerminal` from `pending === 0 && blocked === 0 && in_progress === 0`
- `targetPhase` from `inferPhaseTargetFromTaskCounts(...)`
- then writes that phase into team state and syncs root/linked Ralph terminal state

Relevant code:

- `src/team/runtime.ts:2048-2065`
- `src/team/phase-controller.ts:10-21`

Implication: the runtime phase can become `complete` or `team-fix` based on task inventory alone, even though worker liveness/state is tracked elsewhere in the same monitor pass.

### 2. `runtime-cli` exits on terminal phase alone

The polling loop in `src/team/runtime-cli.ts` currently does this:

- `snap.phase === 'complete'` -> `doShutdown('completed')`
- `snap.phase === 'failed' || snap.phase === 'cancelled'` -> `doShutdown('failed')`

Relevant code:

- `src/team/runtime-cli.ts:316-323`

Implication: once the snapshot phase becomes terminal, the runtime CLI does not require an explicit leader-owned shutdown signal, a worker-idle quorum, or proof that live workers have actually drained.

### 3. Idle/leader-decision signals already exist, but only in side-channel APIs

`src/team/api-interop.ts` already computes richer derived signals including:

- `all_workers_idle`
- `leader_decision_state`
- `leader_attention_pending`
- `done_waiting_on_leader`
- `stuck_waiting_on_leader`

Relevant code:

- `src/team/api-interop.ts:256-357`

Implication: the codebase already distinguishes **"tasks are terminal"** from **"the leader still owes a decision"**, but the runtime shutdown path does not currently consume that distinction.

## Existing coverage and what it proves

### Useful existing tests

- `src/team/__tests__/runtime.test.ts:1801-1838`
  - proves verification evidence can hold the phase at `team-verify`
- `src/team/__tests__/runtime.test.ts:1849-1918`
  - proves terminal phase is mirrored into root team state / linked Ralph state
- `src/team/__tests__/runtime-cli.test.ts:103-123`
  - proves calling `monitorTeam()` directly does not itself delete team state

### Coverage gap

The current `runtime-cli` test does **not** prove that the real runtime polling loop waits for explicit terminal ownership before shutdown. It only proves that `monitorTeam()` can return `complete` without immediate cleanup when `runtime-cli.main()` is not running.

That means the highest-risk gap remains **terminal phase -> automatic runtime shutdown**.

## Residual risks

### Risk 1: premature teardown of live workers

If task state becomes fully terminal before the leader/runtime has intentionally decided to stop, `runtime-cli` can still shut the team down while workers are alive or still flushing results/status.

### Risk 2: split-brain semantics between state surfaces

The codebase currently has two semantic layers:

- **runtime/phase layer**: task-count based terminal inference
- **interop/leader-attention layer**: explicit leader-decision and all-workers-idle signals

As long as only the second layer understands “done, but waiting on leader”, callers can read contradictory truth from adjacent APIs.

### Risk 3: root/linked terminal sync can outrun explicit ownership

Because root team state and linked Ralph state are synchronized immediately after inferred terminal phase, downstream automation may observe a terminal outcome before runtime shutdown ownership is explicitly resolved.

## Recommended contract direction

A durable fix should keep these concepts separate:

1. **Task-terminal**
   - all tasks are terminal
2. **Runtime-terminal-ready**
   - no live worker still owns non-drained work, and
   - the leader/runtime explicitly owns the shutdown decision
3. **Runtime-terminal**
   - shutdown has been intentionally executed

Suggested invariant:

> Default behavior should be **continue**, not **shutdown**, when task-terminal is true but explicit terminal ownership has not yet been established.

In practice that likely means `runtime-cli` should gate shutdown on an explicit runtime/leader-owned signal instead of `snap.phase` alone, or `monitorTeam()` should emit a non-terminal intermediate phase that represents “task-terminal but still leader-owned / worker-draining”.

## Review conclusion

The branch already contains most of the raw signals needed to avoid stop-by-inference behavior, but the final ownership boundary is still too implicit in the runtime shutdown path. The remaining high-value work is to make **explicit terminal ownership** a first-class gating contract for `runtime-cli` and related terminal-state propagation.
