import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { createRalplanStage } from '../stages/ralplan.js';
import { createTeamExecStage, buildTeamInstruction } from '../stages/team-exec.js';
import { createRalphVerifyStage, buildRalphInstruction } from '../stages/ralph-verify.js';
import { buildFollowupStaffingPlan } from '../../team/followup-planner.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let tempDir;
function makeCtx(overrides = {}) {
    return {
        task: 'test task',
        artifacts: {},
        cwd: tempDir,
        ...overrides,
    };
}
async function setup() {
    tempDir = await mkdtemp(join(tmpdir(), 'omx-stages-test-'));
    return tempDir;
}
async function cleanup() {
    if (tempDir && existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
    }
}
// ---------------------------------------------------------------------------
// RALPLAN stage tests
// ---------------------------------------------------------------------------
describe('RALPLAN Stage', () => {
    beforeEach(async () => { await setup(); });
    afterEach(async () => { await cleanup(); });
    it('creates a stage with the correct name', () => {
        const stage = createRalplanStage();
        assert.equal(stage.name, 'ralplan');
    });
    it('runs successfully and produces artifacts', async () => {
        const stage = createRalplanStage();
        const result = await stage.run(makeCtx());
        assert.equal(result.status, 'completed');
        assert.equal(result.artifacts.stage, 'ralplan');
        assert.ok(result.artifacts.instruction);
    });
    it('canSkip returns false when no plans directory exists', () => {
        const stage = createRalplanStage();
        assert.equal(stage.canSkip(makeCtx()), false);
    });
    it('canSkip returns false when plans directory is empty', async () => {
        const plansDir = join(tempDir, '.omx', 'plans');
        await mkdir(plansDir, { recursive: true });
        const stage = createRalplanStage();
        assert.equal(stage.canSkip(makeCtx()), false);
    });
    it('canSkip returns false when only a prd- plan file exists', async () => {
        const plansDir = join(tempDir, '.omx', 'plans');
        await mkdir(plansDir, { recursive: true });
        await writeFile(join(plansDir, 'prd-my-feature.md'), '# Plan\n');
        const stage = createRalplanStage();
        assert.equal(stage.canSkip(makeCtx()), false);
    });
    it('canSkip returns true when both prd and test spec plan files exist', async () => {
        const plansDir = join(tempDir, '.omx', 'plans');
        await mkdir(plansDir, { recursive: true });
        await writeFile(join(plansDir, 'prd-my-feature.md'), '# Plan\n');
        await writeFile(join(plansDir, 'test-spec-my-feature.md'), '# Test Spec\n');
        const stage = createRalplanStage();
        assert.equal(stage.canSkip(makeCtx()), true);
    });
    it('surfaces deep-interview specs in ralplan artifacts for downstream traceability', async () => {
        const specsDir = join(tempDir, '.omx', 'specs');
        await mkdir(specsDir, { recursive: true });
        await writeFile(join(specsDir, 'deep-interview-my-feature.md'), '# Deep Interview Spec\n');
        const stage = createRalplanStage();
        const result = await stage.run(makeCtx());
        const artifacts = result.artifacts;
        assert.deepEqual(artifacts.deepInterviewSpecPaths, [join(specsDir, 'deep-interview-my-feature.md')]);
        assert.equal(artifacts.planningComplete, false);
    });
    it('can execute a real ralplan runtime when an executor is provided', async () => {
        const stage = createRalplanStage({
            executor: {
                async draft() {
                    const plansDir = join(tempDir, '.omx', 'plans');
                    await mkdir(plansDir, { recursive: true });
                    const prdPath = join(plansDir, 'prd-runtime.md');
                    await writeFile(prdPath, '# Runtime Plan\n');
                    await writeFile(join(plansDir, 'test-spec-runtime.md'), '# Runtime Tests\n');
                    return { summary: 'drafted', planPath: prdPath, artifacts: { runtimeDrafted: true } };
                },
                async architectReview() {
                    return { verdict: 'approve', summary: 'architect ok' };
                },
                async criticReview() {
                    return { verdict: 'approve', summary: 'critic ok' };
                },
            },
        });
        const result = await stage.run(makeCtx({ task: 'live ralplan run' }));
        const artifacts = result.artifacts;
        assert.equal(result.status, 'completed');
        assert.equal(artifacts.runtime, true);
        assert.equal(artifacts.planningComplete, true);
        assert.equal(artifacts.iteration, 1);
        assert.equal(artifacts.runtimeDrafted, true);
    });
    it('canSkip returns false for non-prd plan files', async () => {
        const plansDir = join(tempDir, '.omx', 'plans');
        await mkdir(plansDir, { recursive: true });
        await writeFile(join(plansDir, 'autopilot-spec.md'), '# Spec\n');
        const stage = createRalplanStage();
        assert.equal(stage.canSkip(makeCtx()), false);
    });
});
// ---------------------------------------------------------------------------
// Team exec stage tests
// ---------------------------------------------------------------------------
describe('Team Exec Stage', () => {
    beforeEach(async () => { await setup(); });
    afterEach(async () => { await cleanup(); });
    it('creates a stage with the correct name', () => {
        const stage = createTeamExecStage();
        assert.equal(stage.name, 'team-exec');
    });
    it('uses default worker count and agent type', async () => {
        const stage = createTeamExecStage();
        const result = await stage.run(makeCtx());
        assert.equal(result.status, 'completed');
        const arts = result.artifacts;
        assert.equal(arts.workerCount, 2);
        assert.equal(arts.agentType, 'executor');
    });
    it('respects custom worker count and agent type', async () => {
        const stage = createTeamExecStage({ workerCount: 4, agentType: 'architect' });
        const result = await stage.run(makeCtx());
        const arts = result.artifacts;
        assert.equal(arts.workerCount, 4);
        assert.equal(arts.agentType, 'architect');
    });
    it('includes ralplan artifacts in team task when available', async () => {
        const stage = createTeamExecStage();
        const ctx = makeCtx({
            artifacts: {
                ralplan: { data: 'plan-content', stage: 'ralplan' },
            },
        });
        const result = await stage.run(ctx);
        const descriptor = result.artifacts.teamDescriptor;
        assert.ok(descriptor.task.includes('plan-content'));
        assert.ok(Array.isArray(descriptor.availableAgentTypes));
        assert.ok(descriptor.availableAgentTypes.length > 0);
        assert.equal(typeof descriptor.staffingPlan.staffingSummary, 'string');
    });
    it('falls back to raw task when no ralplan artifacts exist', async () => {
        const stage = createTeamExecStage();
        const result = await stage.run(makeCtx({ task: 'raw task description' }));
        const descriptor = result.artifacts.teamDescriptor;
        assert.equal(descriptor.task, 'raw task description');
        assert.equal(typeof descriptor.staffingPlan.staffingSummary, 'string');
    });
    describe('buildTeamInstruction', () => {
        it('builds correct CLI instruction', () => {
            const staffingPlan = buildFollowupStaffingPlan('team', 'implement feature', ['executor', 'test-engineer'], {
                workerCount: 3,
            });
            const instruction = buildTeamInstruction({
                task: 'implement feature',
                workerCount: 3,
                agentType: 'executor',
                availableAgentTypes: ['executor', 'test-engineer'],
                staffingPlan,
                useWorktrees: false,
                cwd: '/tmp/test',
            });
            assert.match(instruction, /^omx team 3:executor /);
            assert.match(instruction, /implement feature/);
            assert.match(instruction, /staffing=/);
            assert.match(instruction, /verify=/);
        });
        it('still emits a launch instruction for long task descriptions', () => {
            const longTask = 'a'.repeat(1000);
            const staffingPlan = buildFollowupStaffingPlan('team', longTask, ['executor', 'test-engineer'], {
                workerCount: 1,
            });
            const instruction = buildTeamInstruction({
                task: longTask,
                workerCount: 1,
                agentType: 'executor',
                availableAgentTypes: ['executor', 'test-engineer'],
                staffingPlan,
                useWorktrees: false,
                cwd: '/tmp',
            });
            assert.match(instruction, /^omx team 1:executor /);
            assert.match(instruction, /staffing=/);
        });
    });
});
// ---------------------------------------------------------------------------
// Ralph verify stage tests
// ---------------------------------------------------------------------------
describe('Ralph Verify Stage', () => {
    beforeEach(async () => { await setup(); });
    afterEach(async () => { await cleanup(); });
    it('creates a stage with the correct name', () => {
        const stage = createRalphVerifyStage();
        assert.equal(stage.name, 'ralph-verify');
    });
    it('uses default max iterations of 10', async () => {
        const stage = createRalphVerifyStage();
        const result = await stage.run(makeCtx());
        assert.equal(result.status, 'completed');
        const arts = result.artifacts;
        assert.equal(arts.maxIterations, 10);
    });
    it('respects custom max iterations', async () => {
        const stage = createRalphVerifyStage({ maxIterations: 25 });
        const result = await stage.run(makeCtx());
        const arts = result.artifacts;
        assert.equal(arts.maxIterations, 25);
    });
    it('includes team-exec artifacts in verification context', async () => {
        const stage = createRalphVerifyStage();
        const ctx = makeCtx({
            artifacts: {
                'team-exec': { teamDescriptor: { task: 'completed work' } },
            },
        });
        const result = await stage.run(ctx);
        const descriptor = result.artifacts.verifyDescriptor;
        const execArtifacts = descriptor.executionArtifacts;
        assert.ok(execArtifacts.teamDescriptor);
        assert.ok(Array.isArray(descriptor.availableAgentTypes));
        assert.equal(typeof descriptor.staffingPlan.staffingSummary, 'string');
    });
    describe('buildRalphInstruction', () => {
        it('includes max iterations in instruction', () => {
            const staffingPlan = buildFollowupStaffingPlan('ralph', 'verify feature', ['architect', 'executor', 'test-engineer']);
            const instruction = buildRalphInstruction({
                task: 'verify feature',
                maxIterations: 15,
                cwd: '/tmp',
                availableAgentTypes: ['architect', 'executor', 'test-engineer'],
                staffingPlan,
                executionArtifacts: {},
            });
            assert.match(instruction, /max_iterations=15/);
            assert.match(instruction, /^omx ralph /);
            assert.match(instruction, /verify feature/);
            assert.match(instruction, /staffing=/);
            assert.match(instruction, /verify=/);
        });
        it('still emits a launch instruction for long task descriptions', () => {
            const longTask = 'b'.repeat(500);
            const staffingPlan = buildFollowupStaffingPlan('ralph', longTask, ['architect', 'executor', 'test-engineer']);
            const instruction = buildRalphInstruction({
                task: longTask,
                maxIterations: 10,
                cwd: '/tmp',
                availableAgentTypes: ['architect', 'executor', 'test-engineer'],
                staffingPlan,
                executionArtifacts: {},
            });
            assert.match(instruction, /^omx ralph /);
            assert.match(instruction, /staffing=/);
        });
    });
});
//# sourceMappingURL=stages.test.js.map