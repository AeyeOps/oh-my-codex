/**
 * Config.toml generator/merger for oh-my-codex
 * Merges OMX MCP server entries and feature flags into existing config.toml
 *
 * TOML structure reminder: bare key=value pairs after a [table] header belong
 * to that table.  Top-level (root-table) keys MUST appear before the first
 * [table] header.  This generator therefore splits its output into:
 *   1. Top-level keys  (notify, model_reasoning_effort, developer_instructions)
 *   2. [features] flags
 *   3. [table] sections (env, mcp_servers, tui)
 */
import type { UnifiedMcpRegistryServer } from "./mcp-registry.js";
interface MergeOptions {
    includeTui?: boolean;
    modelOverride?: string;
    sharedMcpServers?: UnifiedMcpRegistryServer[];
    sharedMcpRegistrySource?: string;
    verbose?: boolean;
}
export declare const OMX_DEVELOPER_INSTRUCTIONS = "You have oh-my-codex installed. AGENTS.md is the orchestration brain and main control surface. Follow AGENTS.md for skill/keyword routing, $name workflow invocation, and role-specialized subagents. Native subagents live in .codex/agents and may handle independent parallel subtasks within one Codex session or team pane. Skills load from .codex/skills, not native-agent TOMLs. Treat installed prompts as narrower execution surfaces under AGENTS.md authority.";
export declare function hasLegacyOmxTeamRunTable(config: string): boolean;
export declare function getRootModelName(config: string): string | undefined;
export declare function stripOmxSeededBehavioralDefaults(config: string): string;
/**
 * Remove any existing OMX-owned top-level keys so we can re-insert them
 * cleanly. Also removes the comment line that precedes them.
 */
export declare function stripOmxTopLevelKeys(config: string): string;
export declare function upsertCodexHooksFeatureFlag(config: string): string;
/**
 * Remove OMX-owned feature flags from the [features] section.
 * If the section becomes empty after removal, remove the section header too.
 */
export declare function stripOmxFeatureFlags(config: string): string;
export declare function stripOmxEnvSettings(config: string): string;
export declare function stripExistingOmxBlocks(config: string): {
    cleaned: string;
    removed: number;
};
export declare function stripExistingSharedMcpRegistryBlock(config: string): {
    cleaned: string;
    removed: number;
};
/**
 * Merge OMX config into existing config.toml
 * Preserves existing user settings, appends OMX block if not present.
 *
 * Layout:
 *   1. OMX top-level keys (notify, model_reasoning_effort, developer_instructions)
 *   2. [features] with multi_agent + child_agents_md
 *   3. [env] with defaulted explore-routing opt-in
 *   4. … user sections …
 *   5. OMX [table] sections (mcp_servers, tui)
 */
export declare function buildMergedConfig(existingConfig: string, pkgRoot: string, options?: MergeOptions): string;
/**
 * Detect and repair upgrade-era managed config incompatibilities in config.toml.
 *
 * After an omx version upgrade the OLD setup code (still loaded in memory)
 * may leave a config with duplicate [tui] sections or the retired
 * [mcp_servers.omx_team_run] table. Codex rejects duplicate tables and newer
 * OMX builds no longer ship the team MCP entrypoint, so we repair both before
 * the CLI is spawned.
 *
 * Returns `true` if a repair was performed.
 */
export declare function repairConfigIfNeeded(configPath: string, pkgRoot: string, options?: MergeOptions): Promise<boolean>;
export declare function mergeConfig(configPath: string, pkgRoot: string, options?: MergeOptions): Promise<void>;
export {};
//# sourceMappingURL=generator.d.ts.map