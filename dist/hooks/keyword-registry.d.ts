export interface KeywordTriggerDefinition {
    keyword: string;
    skill: string;
    priority: number;
    guidance: string;
}
export declare const KEYWORD_TRIGGER_DEFINITIONS: readonly KeywordTriggerDefinition[];
export declare function compareKeywordMatches(a: {
    priority: number;
    keyword: string;
}, b: {
    priority: number;
    keyword: string;
}): number;
//# sourceMappingURL=keyword-registry.d.ts.map