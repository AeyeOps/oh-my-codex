/**
 * Codebase Map Generator for oh-my-codex
 *
 * Generates a lightweight snapshot of the project's source structure and
 * key exported symbols, injected into agent context at session start.
 *
 * Goal: eliminate blind exploration by giving agents an upfront map of
 * where things live — without reading full file contents.
 *
 * Design constraints:
 * - Fast: uses `git ls-files` (no filesystem walk), regex export scan
 * - Minimal: groups files by directory, no full source read
 * - Safe: all errors return empty string (never blocks session start)
 */
/**
 * Generate a compact codebase map for the project at `cwd`.
 *
 * Returns an empty string if:
 * - No git-tracked source files exist
 * - Any error occurs (always safe to call)
 */
export declare function generateCodebaseMap(cwd: string): Promise<string>;
//# sourceMappingURL=codebase-map.d.ts.map