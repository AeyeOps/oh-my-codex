import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getStateDir } from '../state/paths.js';
import { VISUAL_NEXT_ACTIONS_LIMIT } from '../visual/constants.js';
const LEGACY_PRD_PATH = '.omx/prd.json';
const LEGACY_PROGRESS_PATH = '.omx/progress.txt';
const PRD_PREFIX = 'prd-';
const PRD_SUFFIX = '.md';
const DEFAULT_VISUAL_THRESHOLD = 90;
function sha256(text) {
    return createHash('sha256').update(text).digest('hex');
}
function slugify(raw) {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'legacy';
}
function stableJson(value) {
    if (value == null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableJson(item)).join(',')}]`;
    }
    const entries = Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => `${JSON.stringify(key)}:${stableJson(val)}`);
    return `{${entries.join(',')}}`;
}
function stableJsonPretty(value) {
    return JSON.stringify(JSON.parse(stableJson(value)), null, 2);
}
function resolveLegacyPrdTitle(parsed) {
    const candidates = [
        parsed.project,
        parsed.title,
        parsed.branchName,
        parsed.description,
    ];
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim() !== '') {
            return candidate.trim();
        }
    }
    return 'Legacy Ralph PRD';
}
async function listCanonicalPrdFiles(cwd) {
    const plansDir = join(cwd, '.omx', 'plans');
    if (!existsSync(plansDir))
        return [];
    const files = await readdir(plansDir).catch(() => []);
    return files
        .filter((file) => file.startsWith(PRD_PREFIX) && file.endsWith(PRD_SUFFIX))
        .sort()
        .map((file) => join(plansDir, file));
}
function splitProgressLines(content) {
    return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}
async function ensureCanonicalProgressLedgerFile(canonicalProgressPath) {
    if (existsSync(canonicalProgressPath))
        return;
    const now = new Date().toISOString();
    const payload = {
        schema_version: 2,
        created_at: now,
        updated_at: now,
        entries: [],
        visual_feedback: [],
    };
    await mkdir(join(canonicalProgressPath, '..'), { recursive: true });
    await writeFile(canonicalProgressPath, `${stableJsonPretty(payload)}\n`);
}
async function readCanonicalProgressLedger(canonicalProgressPath) {
    if (!existsSync(canonicalProgressPath)) {
        await ensureCanonicalProgressLedgerFile(canonicalProgressPath);
    }
    try {
        const parsed = JSON.parse(await readFile(canonicalProgressPath, 'utf-8'));
        const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
        const visual_feedback = Array.isArray(parsed.visual_feedback) ? parsed.visual_feedback : [];
        const now = new Date().toISOString();
        return {
            ...parsed,
            schema_version: typeof parsed.schema_version === 'number' ? parsed.schema_version : 2,
            entries,
            visual_feedback,
            created_at: typeof parsed.created_at === 'string' ? parsed.created_at : now,
            updated_at: now,
        };
    }
    catch {
        const now = new Date().toISOString();
        return {
            schema_version: 2,
            created_at: now,
            updated_at: now,
            entries: [],
            visual_feedback: [],
        };
    }
}
async function writeMigrationMarker(cwd, patch) {
    const markerPath = join(cwd, '.omx', 'plans', 'ralph-migration-marker.json');
    let existing = {};
    if (existsSync(markerPath)) {
        try {
            existing = JSON.parse(await readFile(markerPath, 'utf-8'));
        }
        catch {
            existing = {};
        }
    }
    const merged = {
        compatibility_window: 'legacy-read-only-one-release-cycle',
        ...existing,
        ...patch,
    };
    await writeFile(markerPath, `${stableJsonPretty(merged)}\n`);
}
async function migrateLegacyPrdIfNeeded(cwd, existingCanonicalPrd) {
    if (existingCanonicalPrd) {
        return { canonicalPrdPath: existingCanonicalPrd, migrated: false };
    }
    const legacyPrdPath = join(cwd, LEGACY_PRD_PATH);
    if (!existsSync(legacyPrdPath)) {
        return { canonicalPrdPath: undefined, migrated: false };
    }
    const legacyRaw = await readFile(legacyPrdPath, 'utf-8');
    let legacyParsed = {};
    try {
        legacyParsed = JSON.parse(legacyRaw);
    }
    catch {
        legacyParsed = { parse_error: 'invalid_json', raw: legacyRaw };
    }
    const plansDir = join(cwd, '.omx', 'plans');
    await mkdir(plansDir, { recursive: true });
    const title = resolveLegacyPrdTitle(legacyParsed);
    const baseSlug = slugify(title);
    let canonicalPrdPath = join(plansDir, `prd-${baseSlug}.md`);
    let counter = 1;
    while (existsSync(canonicalPrdPath)) {
        canonicalPrdPath = join(plansDir, `prd-${baseSlug}-${counter}.md`);
        counter += 1;
    }
    const markdown = [
        `# ${title}`,
        '',
        '> Migrated from legacy `.omx/prd.json` (read-only compatibility import).',
        '',
        '## Migration Marker',
        `- Source: \`${LEGACY_PRD_PATH}\``,
        `- Source SHA256: \`${sha256(legacyRaw)}\``,
        '- Strategy: one-way conversion to canonical PRD markdown',
        '',
        '## Legacy Snapshot',
        '```json',
        stableJsonPretty(legacyParsed),
        '```',
        '',
    ].join('\n');
    await writeFile(canonicalPrdPath, markdown);
    await writeMigrationMarker(cwd, {
        prd_migration: {
            source: LEGACY_PRD_PATH,
            source_sha256: sha256(legacyRaw),
            canonical_path: canonicalPrdPath,
            strategy: 'one-way-read-only',
        },
    });
    return { canonicalPrdPath, migrated: true };
}
async function migrateLegacyProgressIfNeeded(cwd, canonicalProgressPath) {
    if (existsSync(canonicalProgressPath))
        return false;
    const legacyProgressPath = join(cwd, LEGACY_PROGRESS_PATH);
    if (!existsSync(legacyProgressPath))
        return false;
    const raw = await readFile(legacyProgressPath, 'utf-8');
    const lines = splitProgressLines(raw);
    const payload = {
        schema_version: 2,
        source: LEGACY_PROGRESS_PATH,
        source_sha256: sha256(raw),
        strategy: 'one-way-read-only',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        entries: lines.map((line, index) => ({
            index: index + 1,
            text: line,
        })),
        visual_feedback: [],
    };
    await mkdir(join(canonicalProgressPath, '..'), { recursive: true });
    await writeFile(canonicalProgressPath, `${stableJsonPretty(payload)}\n`);
    await writeMigrationMarker(cwd, {
        progress_migration: {
            source: LEGACY_PROGRESS_PATH,
            source_sha256: sha256(raw),
            canonical_path: canonicalProgressPath,
            imported_entries: lines.length,
            strategy: 'one-way-read-only',
        },
    });
    return true;
}
export async function recordRalphVisualFeedback(cwd, feedback, sessionId) {
    const canonicalProgressPath = join(getStateDir(cwd, sessionId), 'ralph-progress.json');
    const ledger = await readCanonicalProgressLedger(canonicalProgressPath);
    const threshold = Number.isFinite(feedback.threshold) ? Number(feedback.threshold) : DEFAULT_VISUAL_THRESHOLD;
    const nextActions = [
        ...feedback.suggestions,
        ...feedback.differences.map((diff) => `Resolve difference: ${diff}`),
    ]
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, VISUAL_NEXT_ACTIONS_LIMIT);
    const entry = {
        recorded_at: new Date().toISOString(),
        score: feedback.score,
        verdict: feedback.verdict,
        category_match: feedback.category_match,
        threshold,
        passes_threshold: feedback.score >= threshold,
        differences: feedback.differences,
        suggestions: feedback.suggestions,
        reasoning: feedback.reasoning ?? '',
        next_actions: nextActions,
        qualitative_feedback: {
            summary: feedback.reasoning ?? feedback.verdict,
            next_actions: nextActions,
        },
    };
    const visualFeedback = Array.isArray(ledger.visual_feedback) ? ledger.visual_feedback : [];
    visualFeedback.push(entry);
    ledger.visual_feedback = visualFeedback.slice(-30);
    ledger.updated_at = new Date().toISOString();
    await mkdir(join(canonicalProgressPath, '..'), { recursive: true });
    await writeFile(canonicalProgressPath, `${stableJsonPretty(ledger)}\n`);
}
export async function ensureCanonicalRalphArtifacts(cwd, sessionId) {
    const canonicalProgressPath = join(getStateDir(cwd, sessionId), 'ralph-progress.json');
    await mkdir(join(cwd, '.omx', 'plans'), { recursive: true });
    await mkdir(getStateDir(cwd, sessionId), { recursive: true });
    const canonicalPrdFiles = await listCanonicalPrdFiles(cwd);
    const migratedPrdResult = await migrateLegacyPrdIfNeeded(cwd, canonicalPrdFiles[0]);
    const migratedProgress = await migrateLegacyProgressIfNeeded(cwd, canonicalProgressPath);
    await ensureCanonicalProgressLedgerFile(canonicalProgressPath);
    return {
        canonicalPrdPath: migratedPrdResult.canonicalPrdPath,
        canonicalProgressPath,
        migratedPrd: migratedPrdResult.migrated,
        migratedProgress,
    };
}
//# sourceMappingURL=persistence.js.map