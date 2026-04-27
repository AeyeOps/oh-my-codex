#!/usr/bin/env node
export interface PromptSurfaceInventory {
    path: string;
    lines: number;
    approximateTokens: number;
    absoluteDirectiveCount: number;
    markers: Record<string, number>;
}
export interface DuplicateFragmentFamily {
    text: string;
    count: number;
    paths: string[];
}
export interface PromptInventoryReport {
    generatedAt: string;
    root: string;
    totals: {
        files: number;
        lines: number;
        approximateTokens: number;
        absoluteDirectiveCount: number;
    };
    surfaces: PromptSurfaceInventory[];
    duplicateFragmentFamilies: DuplicateFragmentFamily[];
}
export declare function listPromptSurfacePaths(root?: string): string[];
export declare function buildPromptInventory(root?: string, generatedAt?: string): PromptInventoryReport;
export declare function renderPromptInventoryMarkdown(report: PromptInventoryReport): string;
//# sourceMappingURL=prompt-inventory.d.ts.map