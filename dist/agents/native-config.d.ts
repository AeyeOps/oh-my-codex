/**
 * Native agent config generators for Codex CLI.
 * Writes standalone TOML files under ~/.codex/agents/ or ./.codex/agents/.
 */
import { AgentDefinition } from "./definitions.js";
import type { CatalogManifest } from "../catalog/schema.js";
export declare const EXACT_GPT_5_4_MINI_MODEL = "gpt-5.4-mini";
export interface GeneratedNativeAgentConfig {
    name: string;
    description: string;
    developerInstructions?: string;
    model?: string;
    reasoningEffort?: "low" | "medium" | "high" | "xhigh";
}
interface AgentModelResolutionOptions {
    codexHomeOverride?: string;
    configTomlContent?: string;
    env?: NodeJS.ProcessEnv;
}
interface RoleInstructionMetadata {
    name: string;
    posture: AgentDefinition["posture"];
    modelClass: AgentDefinition["modelClass"];
    routingRole: AgentDefinition["routingRole"];
}
export declare function composeRoleInstructions(promptContent: string, metadata: RoleInstructionMetadata | null, resolvedModel?: string): string;
export declare function composeRoleInstructionsForRole(roleName: string, promptContent: string, resolvedModel?: string): string;
/**
 * Strip YAML frontmatter (between --- markers) from markdown content.
 */
export declare function stripFrontmatter(content: string): string;
export declare function generateStandaloneAgentToml(config: GeneratedNativeAgentConfig): string;
/**
 * Generate TOML content for a prompt-backed OMX role agent.
 */
export declare function generateAgentToml(agent: AgentDefinition, promptContent: string, options?: AgentModelResolutionOptions): string;
/**
 * Install prompt-backed native agent config .toml files to ~/.codex/agents/
 * Returns the number of agent files written.
 */
export declare function installNativeAgentConfigs(pkgRoot: string, options?: {
    force?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
    agentsDir?: string;
    catalogManifest?: CatalogManifest;
    allowUncatalogedDefinitions?: boolean;
}): Promise<number>;
export {};
//# sourceMappingURL=native-config.d.ts.map