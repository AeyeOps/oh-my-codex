/**
 * omx setup - Automated installation of oh-my-codex
 * Installs skills, prompts, MCP servers config, and AGENTS.md
 */
interface SetupOptions {
    codexVersionProbe?: () => string | null;
    force?: boolean;
    dryRun?: boolean;
    installMode?: SetupInstallMode;
    scope?: SetupScope;
    verbose?: boolean;
    agentsOverwritePrompt?: (destinationPath: string) => Promise<boolean>;
    installModePrompt?: (defaultMode: SetupInstallMode) => Promise<SetupInstallMode>;
    modelUpgradePrompt?: (currentModel: string, targetModel: string) => Promise<boolean>;
    pluginAgentsMdPrompt?: (destinationPath: string) => Promise<boolean>;
    pluginDeveloperInstructionsPrompt?: (configPath: string) => Promise<boolean>;
    pluginDeveloperInstructionsOverwritePrompt?: (configPath: string) => Promise<boolean>;
    mcpRegistryCandidates?: string[];
}
export declare const SETUP_SCOPES: readonly ["user", "project"];
export type SetupScope = (typeof SETUP_SCOPES)[number];
export declare const SETUP_INSTALL_MODES: readonly ["legacy", "plugin"];
export type SetupInstallMode = (typeof SETUP_INSTALL_MODES)[number];
export interface ScopeDirectories {
    codexConfigFile: string;
    codexHomeDir: string;
    codexHooksFile: string;
    nativeAgentsDir: string;
    promptsDir: string;
    skillsDir: string;
}
interface SetupCategorySummary {
    updated: number;
    unchanged: number;
    backedUp: number;
    skipped: number;
    removed: number;
}
interface SetupBackupContext {
    backupRoot: string;
    baseRoot: string;
}
export interface SkillFrontmatterMetadata {
    name: string;
    description: string;
}
export declare function parseSkillFrontmatter(content: string, filePath?: string): SkillFrontmatterMetadata;
export declare function validateSkillFile(skillMdPath: string): Promise<void>;
export declare function resolveScopeDirectories(scope: SetupScope, projectRoot: string): ScopeDirectories;
export declare function setup(options?: SetupOptions): Promise<void>;
export declare function installSkills(srcDir: string, dstDir: string, backupContext: SetupBackupContext, options: SetupOptions): Promise<SetupCategorySummary>;
export {};
//# sourceMappingURL=setup.d.ts.map