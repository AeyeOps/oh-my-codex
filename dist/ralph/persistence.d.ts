import { type VisualVerdictStatus } from '../visual/constants.js';
export interface RalphVisualFeedback {
    score: number;
    verdict: VisualVerdictStatus;
    category_match: boolean;
    differences: string[];
    suggestions: string[];
    reasoning?: string;
    threshold?: number;
}
export interface RalphProgressLedger {
    schema_version: number;
    source?: string;
    source_sha256?: string;
    strategy?: string;
    created_at?: string;
    updated_at?: string;
    entries: Array<Record<string, unknown>>;
    visual_feedback?: Array<Record<string, unknown>>;
}
export interface RalphCanonicalArtifacts {
    canonicalPrdPath?: string;
    canonicalProgressPath: string;
    migratedPrd: boolean;
    migratedProgress: boolean;
}
export declare function recordRalphVisualFeedback(cwd: string, feedback: RalphVisualFeedback, sessionId?: string): Promise<void>;
export declare function ensureCanonicalRalphArtifacts(cwd: string, sessionId?: string): Promise<RalphCanonicalArtifacts>;
//# sourceMappingURL=persistence.d.ts.map