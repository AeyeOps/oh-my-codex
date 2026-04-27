import { cancelMode, readModeState, startMode, updateModeState } from '../modes/base.js';
import { readPlanningArtifacts } from '../planning/artifacts.js';
export const RALPLAN_ACTIVE_PHASES = [
    'draft',
    'architect-review',
    'critic-review',
    'complete',
];
function buildReviewHistory(drafts, architectReviews, criticReviews) {
    const entries = [];
    const total = Math.max(drafts.length, architectReviews.length, criticReviews.length);
    for (let index = 0; index < total; index++) {
        entries.push({
            iteration: index + 1,
            draft: drafts[index] ?? null,
            architect_review: architectReviews[index] ?? null,
            critic_review: criticReviews[index] ?? null,
        });
    }
    return entries;
}
async function updateRalplanState(cwd, updates) {
    await updateModeState('ralplan', updates, cwd);
}
export async function runRalplanConsensus(executor, options) {
    const cwd = options.cwd ?? process.cwd();
    const maxIterations = options.maxIterations ?? 5;
    const drafts = [];
    const architectReviews = [];
    const criticReviews = [];
    const aggregatedArtifacts = {};
    let latestPlanPath;
    let iteration = 1;
    const existing = await readModeState('ralplan', cwd);
    if (existing?.active) {
        throw new Error('ralplan_active_mode_exists');
    }
    await startMode('ralplan', options.task, maxIterations, cwd);
    try {
        while (iteration <= maxIterations) {
            const iterationContext = {
                task: options.task,
                cwd,
                iteration,
                priorDrafts: [...drafts],
                architectReviews: [...architectReviews],
                criticReviews: [...criticReviews],
            };
            await updateRalplanState(cwd, {
                iteration,
                current_phase: 'draft',
                planning_complete: false,
                review_history: buildReviewHistory(drafts, architectReviews, criticReviews),
            });
            const draft = await executor.draft(iterationContext);
            drafts.push(draft);
            if (draft.artifacts)
                Object.assign(aggregatedArtifacts, draft.artifacts);
            if (draft.planPath)
                latestPlanPath = draft.planPath;
            await updateRalplanState(cwd, {
                iteration,
                current_phase: 'architect-review',
                latest_plan_path: latestPlanPath,
                latest_draft_summary: draft.summary,
                review_history: buildReviewHistory(drafts, architectReviews, criticReviews),
            });
            const architectReview = await executor.architectReview({
                ...iterationContext,
                draft,
            });
            architectReviews.push(architectReview);
            if (architectReview.artifacts)
                Object.assign(aggregatedArtifacts, architectReview.artifacts);
            await updateRalplanState(cwd, {
                iteration,
                current_phase: 'critic-review',
                latest_architect_verdict: architectReview.verdict,
                latest_architect_summary: architectReview.summary,
                review_history: buildReviewHistory(drafts, architectReviews, criticReviews),
            });
            const criticReview = await executor.criticReview({
                ...iterationContext,
                draft,
                architectReview,
            });
            criticReviews.push(criticReview);
            if (criticReview.artifacts)
                Object.assign(aggregatedArtifacts, criticReview.artifacts);
            const reviewHistory = buildReviewHistory(drafts, architectReviews, criticReviews);
            await updateRalplanState(cwd, {
                iteration,
                current_phase: 'critic-review',
                latest_critic_verdict: criticReview.verdict,
                latest_critic_summary: criticReview.summary,
                review_history: reviewHistory,
            });
            if (criticReview.verdict === 'approve') {
                const planningArtifacts = readPlanningArtifacts(cwd);
                const planningComplete = planningArtifacts.prdPaths.length > 0 && planningArtifacts.testSpecPaths.length > 0;
                await updateRalplanState(cwd, {
                    active: false,
                    iteration,
                    current_phase: 'complete',
                    completed_at: new Date().toISOString(),
                    planning_complete: planningComplete,
                    latest_plan_path: latestPlanPath,
                    review_history: reviewHistory,
                });
                return {
                    status: 'completed',
                    iteration,
                    phase: 'complete',
                    planningComplete,
                    drafts,
                    architectReviews,
                    criticReviews,
                    latestPlanPath,
                    artifacts: aggregatedArtifacts,
                };
            }
            if (iteration >= maxIterations) {
                const error = `ralplan_consensus_not_reached_after_${maxIterations}_iterations`;
                await updateRalplanState(cwd, {
                    active: false,
                    iteration,
                    current_phase: 'failed',
                    completed_at: new Date().toISOString(),
                    planning_complete: false,
                    latest_plan_path: latestPlanPath,
                    latest_critic_verdict: criticReview.verdict,
                    latest_critic_summary: criticReview.summary,
                    review_history: reviewHistory,
                    error,
                });
                return {
                    status: 'failed',
                    iteration,
                    phase: 'failed',
                    planningComplete: false,
                    drafts,
                    architectReviews,
                    criticReviews,
                    latestPlanPath,
                    artifacts: aggregatedArtifacts,
                    error,
                };
            }
            iteration += 1;
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await updateRalplanState(cwd, {
            active: false,
            iteration,
            current_phase: 'failed',
            completed_at: new Date().toISOString(),
            planning_complete: false,
            latest_plan_path: latestPlanPath,
            review_history: buildReviewHistory(drafts, architectReviews, criticReviews),
            error: message,
        });
        return {
            status: 'failed',
            iteration,
            phase: 'failed',
            planningComplete: false,
            drafts,
            architectReviews,
            criticReviews,
            latestPlanPath,
            artifacts: aggregatedArtifacts,
            error: message,
        };
    }
    const unreachableError = 'ralplan_runtime_unreachable_state';
    await updateRalplanState(cwd, {
        active: false,
        iteration,
        current_phase: 'failed',
        completed_at: new Date().toISOString(),
        planning_complete: false,
        error: unreachableError,
    });
    return {
        status: 'failed',
        iteration,
        phase: 'failed',
        planningComplete: false,
        drafts,
        architectReviews,
        criticReviews,
        latestPlanPath,
        artifacts: aggregatedArtifacts,
        error: unreachableError,
    };
}
export async function cancelRalplanConsensus(cwd) {
    await cancelMode('ralplan', cwd);
}
//# sourceMappingURL=runtime.js.map