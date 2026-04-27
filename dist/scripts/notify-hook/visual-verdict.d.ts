/**
 * Visual verdict extraction and persistence.
 *
 * Parses PASS / FAIL / INCOMPLETE verdicts from verifier agent output
 * and persists them to stateDir/verdicts/latest-verdict.json.
 *
 * All failures are logged with structured context (issue #421) rather
 * than silently swallowed.
 */
/**
 * Attempt to extract a structured verdict from free-form text.
 * Returns `{ verdict, raw }` on success, `null` otherwise.
 */
export declare function parseVisualVerdict(text: any): {
    verdict: string;
    raw: string;
} | null;
/**
 * Parse a visual verdict from the agent payload output and persist it.
 *
 * Logs structured warnings/debug events instead of silently swallowing
 * errors (addresses issue #421):
 *   - debug: candidate markers found but no structured verdict matched
 *   - warn:  verdict file write failure (with turn/session context)
 *
 * Module import failure is handled by the caller in notify-hook.ts.
 */
export declare function maybePersistVisualVerdict({ cwd, payload, stateDir, logsDir, sessionId, turnId }: any): Promise<void>;
//# sourceMappingURL=visual-verdict.d.ts.map