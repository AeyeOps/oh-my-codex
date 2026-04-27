/**
 * Task Size Detector — ported from OMC src/hooks/task-size-detector/index.ts
 *
 * IMPORTANT: In OMC, this module runs at prompt time via bridge.ts hook interception
 * (mandatory enforcement). In OMX, Codex CLI does not support pre-tool hooks, so this
 * module serves as:
 *   1. Instruction generator — feeds generateKeywordDetectionSection() in emulator.ts
 *   2. Test infrastructure — verifies gate logic correctness
 *   3. Future hook readiness — will be promoted to runtime enforcement when Codex CLI
 *      adds pre-hook support
 *
 * The actual gate enforcement in OMX is advisory: AGENTS.md instructs the model to
 * self-enforce gate behavior. The model may skip the gate under edge cases (long context,
 * prompt injection, model confusion).
 */
export type TaskSize = 'small' | 'medium' | 'large';
export interface TaskSizeResult {
    size: TaskSize;
    reason: string;
    wordCount: number;
    hasEscapeHatch: boolean;
    escapePrefixUsed?: string;
}
/**
 * Word limit thresholds for task size classification.
 * Prompts under smallLimit are classified as small (unless overridden).
 * Prompts over largeLimit are classified as large.
 */
export interface TaskSizeThresholds {
    smallWordLimit: number;
    largeWordLimit: number;
}
export declare const DEFAULT_THRESHOLDS: TaskSizeThresholds;
/**
 * Count words in a prompt (splits on whitespace).
 */
export declare function countWords(text: string): number;
/**
 * Check if the prompt starts with a lightweight escape hatch prefix.
 * Returns the prefix if found, null otherwise.
 */
export declare function detectEscapeHatch(text: string): string | null;
/**
 * Check for small task signal patterns (single file, typo, minor, etc.)
 */
export declare function hasSmallTaskSignals(text: string): boolean;
/**
 * Check for large task signal patterns (architecture, refactor, entire codebase, etc.)
 */
export declare function hasLargeTaskSignals(text: string): boolean;
/**
 * Classify a user prompt as small, medium, or large.
 *
 * Classification rules (in priority order):
 * 1. Escape hatch prefix (`quick:`, `simple:`, etc.) → always small
 * 2. Large task signals (architecture, refactor, entire codebase) → large
 * 3. Prompt > largeWordLimit words → large
 * 4. Small task signals (typo, single file, rename) AND prompt < largeWordLimit → small
 * 5. Prompt < smallWordLimit words → small
 * 6. Everything else → medium
 */
export declare function classifyTaskSize(text: string, thresholds?: TaskSizeThresholds): TaskSizeResult;
/**
 * Heavy orchestration keyword types that should be suppressed for small tasks.
 * These modes spin up multiple agents and are overkill for single-file/minor changes.
 */
export declare const HEAVY_MODE_KEYWORDS: Set<string>;
/**
 * Check if a keyword type is a heavy orchestration mode.
 */
export declare function isHeavyMode(keywordType: string): boolean;
//# sourceMappingURL=task-size-detector.d.ts.map