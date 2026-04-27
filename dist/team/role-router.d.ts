/**
 * Role Router for team orchestration.
 *
 * Layer 1: Prompt loading utilities (loadRolePrompt, isKnownRole, listAvailableRoles)
 * Layer 2: Heuristic role routing (routeTaskToRole, computeWorkerRoleAssignments)
 */
import type { TeamPhase } from './orchestrator.js';
/**
 * Load behavioral prompt content for a given agent role.
 * Returns null if the prompt file does not exist or the role name is invalid.
 */
export declare function loadRolePrompt(role: string, promptsDir: string): Promise<string | null>;
/**
 * Check whether a role has a corresponding prompt file.
 */
export declare function isKnownRole(role: string, promptsDir: string): boolean;
/**
 * List all available roles by scanning the prompts directory.
 * Returns role names (filename without .md extension).
 */
export declare function listAvailableRoles(promptsDir: string): Promise<string[]>;
export interface RoleRouterResult {
    role: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
}
/**
 * Map a task description to the best agent role using keyword heuristics.
 * Falls back to fallbackRole when confidence is low.
 */
export declare function routeTaskToRole(taskSubject: string, taskDescription: string, phase: TeamPhase | null, fallbackRole: string): RoleRouterResult;
//# sourceMappingURL=role-router.d.ts.map