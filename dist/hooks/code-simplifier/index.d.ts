/**
 * Code Simplifier Stop Hook
 *
 * Intercepts agent turn completions to automatically delegate recently modified
 * files to the code-simplifier agent for cleanup and simplification.
 *
 * Opt-in via ~/.omx/config.json: { "codeSimplifier": { "enabled": true } }
 * Default: disabled (opt-in only)
 */
/** Config shape for the code-simplifier feature */
export interface CodeSimplifierConfig {
    enabled: boolean;
    /** File extensions to include (default: common source extensions) */
    extensions?: string[];
    /** Maximum number of files to simplify per trigger (default: 10) */
    maxFiles?: number;
}
/** Global OMX config shape (subset relevant to code-simplifier) */
interface OmxGlobalConfig {
    codeSimplifier?: CodeSimplifierConfig;
}
/** Result returned from processCodeSimplifier */
export interface CodeSimplifierResult {
    triggered: boolean;
    message: string;
}
/** Marker filename used to prevent re-triggering within the same turn cycle */
export declare const TRIGGER_MARKER_FILENAME = "code-simplifier-triggered.marker";
/**
 * Read the global OMX config from ~/.omx/config.json.
 * Returns null if the file does not exist or cannot be parsed.
 *
 * @param configDir - Optional override for the home directory. When provided,
 *   the config is read from `<configDir>/.omx/config.json` instead of
 *   `~/.omx/config.json`. Useful for testing without relying on `os.homedir()`.
 */
export declare function readOmxConfig(configDir?: string): OmxGlobalConfig | null;
/**
 * Check whether the code-simplifier feature is enabled in config.
 * Disabled by default — requires explicit opt-in.
 */
export declare function isCodeSimplifierEnabled(configDir?: string): boolean;
/**
 * Get list of changed source files via `git status --porcelain`.
 * Includes modified, added, renamed-new-path, and untracked files.
 * Excludes deleted entries and any path that no longer exists.
 * Returns an empty array if git is unavailable or no files are modified.
 */
export declare function getModifiedFiles(cwd: string, extensions?: string[], maxFiles?: number): string[];
/**
 * Check whether the code-simplifier was already triggered this turn
 * (marker file present in the state directory).
 */
export declare function isAlreadyTriggered(stateDir: string): boolean;
/**
 * Write the trigger marker to prevent re-triggering in the same turn cycle.
 */
export declare function writeTriggerMarker(stateDir: string): void;
/**
 * Clear the trigger marker after a completed simplification round,
 * allowing the hook to trigger again on the next turn.
 */
export declare function clearTriggerMarker(stateDir: string): void;
/**
 * Build the message injected into the agent's context when code-simplifier triggers.
 */
export declare function buildSimplifierMessage(files: string[]): string;
/**
 * Process the code-simplifier hook logic.
 *
 * Logic:
 * 1. Return early (no trigger) if the feature is disabled
 * 2. If already triggered this turn (marker present), clear marker and skip
 * 3. Get modified files via git diff HEAD
 * 4. Return early if no relevant files are modified
 * 5. Write trigger marker and build the simplifier delegation message
 */
export declare function processCodeSimplifier(cwd: string, stateDir: string, configDir?: string): CodeSimplifierResult;
export {};
//# sourceMappingURL=index.d.ts.map