import { type DocumentRefreshRule } from "./config.js";
export type DocumentRefreshScope = "commit" | "final-handoff";
export type DocumentRefreshHookEventName = "PreToolUse" | "Stop";
export interface ChangedPathRecord {
    status: string;
    path: string;
    previousPath?: string;
}
export interface DocumentRefreshEvaluationInput {
    scope: DocumentRefreshScope;
    changes: ChangedPathRecord[];
    rules?: DocumentRefreshRule[];
    exemptionText?: string | null;
    localFreshTargets?: string[];
}
export interface DocumentRefreshRuleWarning {
    ruleId: string;
    description: string;
    changedPaths: string[];
    refreshTargets: string[];
}
export interface DocumentRefreshWarning {
    scope: DocumentRefreshScope;
    rules: DocumentRefreshRuleWarning[];
    triggeringPaths: string[];
    expectedTargets: string[];
    message: string;
}
export declare const DOCUMENT_REFRESH_EXEMPTION_PREFIX = "Document-refresh: not-needed |";
export declare function globToRegExp(glob: string): RegExp;
export declare function pathMatchesGlob(path: string, glob: string): boolean;
export declare function hasDocumentRefreshExemption(text: string | null | undefined): boolean;
export declare function parseGitNameStatus(text: string): ChangedPathRecord[];
export declare function evaluateDocumentRefresh(input: DocumentRefreshEvaluationInput): DocumentRefreshWarning | null;
export declare function isFinalHandoffDocumentRefreshCandidate(text: string | null | undefined): boolean;
export declare function buildDocumentRefreshAdvisoryOutput(warning: DocumentRefreshWarning, hookEventName: DocumentRefreshHookEventName): Record<string, unknown>;
export declare function formatDocumentRefreshWarning(warning: DocumentRefreshWarning): string;
export declare function readStagedGitChanges(cwd: string): ChangedPathRecord[] | null;
export declare function readStagedAndUnstagedGitChanges(cwd: string): ChangedPathRecord[] | null;
export declare function findFreshLocalPlanningTargets(cwd: string, changes: readonly ChangedPathRecord[], rules?: readonly DocumentRefreshRule[]): string[];
export declare function evaluateStagedDocumentRefresh(cwd: string, exemptionText?: string | null): DocumentRefreshWarning | null;
export declare function evaluateFinalHandoffDocumentRefresh(cwd: string, exemptionText?: string | null): DocumentRefreshWarning | null;
//# sourceMappingURL=enforcer.d.ts.map