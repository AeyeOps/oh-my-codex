export interface DocumentRefreshRule {
    id: string;
    description: string;
    sourceGlobs: string[];
    refreshTargets: string[];
    ignoredGlobs?: string[];
}
export declare const DEFAULT_DOCUMENT_REFRESH_RULES: DocumentRefreshRule[];
//# sourceMappingURL=config.d.ts.map