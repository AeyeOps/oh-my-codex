import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { omxPlansDir } from '../utils/paths.js';
const PRD_PATTERN = /^prd-.*\.md$/i;
const TEST_SPEC_PATTERN = /^test-?spec-.*\.md$/i;
const DEEP_INTERVIEW_SPEC_PATTERN = /^deep-interview-.*\.md$/i;
function readMatchingPaths(dir, pattern) {
    if (!existsSync(dir)) {
        return [];
    }
    try {
        return readdirSync(dir)
            .filter((file) => pattern.test(file))
            .sort((a, b) => a.localeCompare(b))
            .map((file) => join(dir, file));
    }
    catch {
        return [];
    }
}
export function readPlanningArtifacts(cwd) {
    const plansDir = omxPlansDir(cwd);
    const specsDir = join(cwd, '.omx', 'specs');
    return {
        plansDir,
        specsDir,
        prdPaths: readMatchingPaths(plansDir, PRD_PATTERN),
        testSpecPaths: readMatchingPaths(plansDir, TEST_SPEC_PATTERN),
        deepInterviewSpecPaths: readMatchingPaths(specsDir, DEEP_INTERVIEW_SPEC_PATTERN),
    };
}
export function isPlanningComplete(artifacts) {
    return artifacts.prdPaths.length > 0 && artifacts.testSpecPaths.length > 0;
}
function decodeQuotedValue(raw) {
    const normalized = raw.trim();
    if (!normalized)
        return null;
    try {
        return JSON.parse(normalized);
    }
    catch {
        if ((normalized.startsWith('"') && normalized.endsWith('"'))
            || (normalized.startsWith("'") && normalized.endsWith("'"))) {
            return normalized.slice(1, -1);
        }
        return null;
    }
}
function artifactSlug(path, prefixPattern) {
    const file = basename(path);
    const match = file.match(prefixPattern);
    return match?.groups?.slug ?? null;
}
function filterArtifactsForSlug(paths, prefixPattern, slug) {
    if (!slug)
        return [];
    return paths.filter((path) => artifactSlug(path, prefixPattern) === slug);
}
function readApprovedPlanText(cwd) {
    const artifacts = readPlanningArtifacts(cwd);
    if (!isPlanningComplete(artifacts))
        return null;
    const selection = selectLatestPlanningArtifacts(artifacts);
    const latestPrdPath = selection.prdPath;
    if (!latestPrdPath || !existsSync(latestPrdPath))
        return null;
    try {
        return {
            content: readFileSync(latestPrdPath, 'utf-8'),
            context: {
                sourcePath: latestPrdPath,
                testSpecPaths: selection.testSpecPaths,
                deepInterviewSpecPaths: selection.deepInterviewSpecPaths,
            },
        };
    }
    catch {
        return null;
    }
}
export function selectLatestPlanningArtifacts(artifacts) {
    const latestPrdPath = artifacts.prdPaths.at(-1) ?? null;
    const slug = latestPrdPath
        ? artifactSlug(latestPrdPath, /^prd-(?<slug>.*)\.md$/i)
        : null;
    return {
        prdPath: latestPrdPath,
        testSpecPaths: filterArtifactsForSlug(artifacts.testSpecPaths, /^test-?spec-(?<slug>.*)\.md$/i, slug),
        deepInterviewSpecPaths: filterArtifactsForSlug(artifacts.deepInterviewSpecPaths, /^deep-interview-(?<slug>.*)\.md$/i, slug),
    };
}
export function readLatestPlanningArtifacts(cwd) {
    return selectLatestPlanningArtifacts(readPlanningArtifacts(cwd));
}
export function readApprovedExecutionLaunchHint(cwd, mode) {
    const approvedPlan = readApprovedPlanText(cwd);
    if (!approvedPlan)
        return null;
    if (mode === 'team') {
        const teamPattern = /(?<command>(?:omx\s+team|\$team)\s+(?<ralph>ralph\s+)?(?<count>\d+)(?::(?<role>[a-z][a-z0-9-]*))?\s+(?<task>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))/gi;
        const matches = [...approvedPlan.content.matchAll(teamPattern)];
        const last = matches.at(-1);
        if (!last?.groups)
            return null;
        const task = decodeQuotedValue(last.groups.task);
        if (!task)
            return null;
        return {
            mode,
            command: last.groups.command,
            task,
            workerCount: Number.parseInt(last.groups.count, 10),
            agentType: last.groups.role || undefined,
            linkedRalph: Boolean(last.groups.ralph?.trim()),
            ...approvedPlan.context,
        };
    }
    const ralphPattern = /(?<command>(?:omx\s+ralph|\$ralph)\s+(?<task>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))/gi;
    const matches = [...approvedPlan.content.matchAll(ralphPattern)];
    const last = matches.at(-1);
    if (!last?.groups)
        return null;
    const task = decodeQuotedValue(last.groups.task);
    if (!task)
        return null;
    return {
        mode,
        command: last.groups.command,
        task,
        ...approvedPlan.context,
    };
}
//# sourceMappingURL=artifacts.js.map