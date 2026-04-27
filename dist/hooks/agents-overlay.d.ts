/**
 * AGENTS.md Runtime Overlay for oh-my-codex
 *
 * Dynamically injects session-specific context into AGENTS.md before Codex
 * launches, then strips it after session ends. Uses marker-bounded sections
 * for idempotent apply/strip cycles.
 *
 * Injected context:
 * - Codebase map (directory/module structure for token-efficient exploration)
 * - Active mode state (ralph iteration, autopilot phase, etc.)
 * - Priority notepad content
 * - Project memory summary (tech stack, conventions, directives)
 * - Compaction survival instructions
 * - Session metadata
 */
export type SessionOrchestrationMode = "default" | "team";
export interface GenerateOverlayOptions {
    orchestrationMode?: SessionOrchestrationMode;
}
export declare function resolveSessionOrchestrationMode(cwd: string, sessionId?: string, activeSkill?: string): Promise<SessionOrchestrationMode>;
/**
 * Generate the overlay content to inject into AGENTS.md.
 * Total output is capped at MAX_OVERLAY_SIZE chars.
 */
export declare function generateOverlay(cwd: string, sessionId?: string, options?: GenerateOverlayOptions): Promise<string>;
/**
 * Apply overlay to AGENTS.md. Strips any existing overlay first (idempotent).
 * Uses file locking to prevent concurrent access corruption.
 */
export declare function applyOverlay(agentsMdPath: string, overlay: string, cwd?: string): Promise<void>;
/**
 * Strip overlay from AGENTS.md, restoring it to clean state.
 * Uses file locking to prevent concurrent access corruption.
 */
export declare function stripOverlay(agentsMdPath: string, cwd?: string): Promise<void>;
/**
 * Check if AGENTS.md currently has an overlay applied.
 */
export declare function hasOverlay(content: string): boolean;
export declare function sessionModelInstructionsPath(cwd: string, sessionId: string): string;
/**
 * Build a session-scoped AGENTS.md that combines user-level CODEX_HOME
 * instructions, project instructions (if any), and the runtime overlay,
 * without mutating the source AGENTS.md files.
 */
export declare function writeSessionModelInstructionsFile(cwd: string, sessionId: string, overlay: string): Promise<string>;
/**
 * Best-effort cleanup for session-scoped model instructions file.
 */
export declare function removeSessionModelInstructionsFile(cwd: string, sessionId: string): Promise<void>;
//# sourceMappingURL=agents-overlay.d.ts.map