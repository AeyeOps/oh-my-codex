import { type VisualVerdictStatus } from './constants.js';
export interface VisualVerdict {
    score: number;
    verdict: VisualVerdictStatus;
    category_match: boolean;
    differences: string[];
    suggestions: string[];
    reasoning: string;
}
export interface VisualLoopFeedback extends VisualVerdict {
    threshold: number;
    passes_threshold: boolean;
    next_actions: string[];
}
export declare function parseVisualVerdict(input: unknown): VisualVerdict;
export declare function buildVisualLoopFeedback(input: unknown, threshold?: number): VisualLoopFeedback;
//# sourceMappingURL=verdict.d.ts.map