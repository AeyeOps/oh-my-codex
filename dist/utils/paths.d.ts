/**
 * Path utilities for oh-my-codex
 * Resolves Codex CLI config, skills, prompts, and state directories
 */
/** Codex CLI home directory (~/.codex/) */
export declare function codexHome(): string;
export declare const OMX_ENTRY_PATH_ENV = "OMX_ENTRY_PATH";
export declare const OMX_STARTUP_CWD_ENV = "OMX_STARTUP_CWD";
export declare function canonicalizeComparablePath(rawPath: string): string;
export declare function sameFilePath(leftPath: string, rightPath: string): boolean;
export declare function resolveOmxEntryPath(options?: {
    argv1?: string | null;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}): string | null;
export declare function resolveOmxCliEntryPath(options?: {
    argv1?: string | null;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    packageRootDir?: string;
}): string | null;
export declare function rememberOmxLaunchContext(options?: {
    argv1?: string | null;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}): void;
/** Codex config file path (~/.codex/config.toml) */
export declare function codexConfigPath(): string;
/** Codex prompts directory (~/.codex/prompts/) */
export declare function codexPromptsDir(): string;
/** Codex native agents directory (~/.codex/agents/) */
export declare function codexAgentsDir(codexHomeDir?: string): string;
/** Project-level Codex native agents directory (.codex/agents/) */
export declare function projectCodexAgentsDir(projectRoot?: string): string;
/** User-level skills directory ($CODEX_HOME/skills, defaults to ~/.codex/skills/) */
export declare function userSkillsDir(): string;
/** Project-level skills directory (.codex/skills/) */
export declare function projectSkillsDir(projectRoot?: string): string;
/** Historical legacy user-level skills directory (~/.agents/skills/) */
export declare function legacyUserSkillsDir(): string;
export type InstalledSkillScope = "project" | "user";
export interface InstalledSkillDirectory {
    name: string;
    path: string;
    scope: InstalledSkillScope;
}
export interface SkillRootOverlapReport {
    canonicalDir: string;
    legacyDir: string;
    canonicalExists: boolean;
    legacyExists: boolean;
    canonicalResolvedDir: string | null;
    legacyResolvedDir: string | null;
    sameResolvedTarget: boolean;
    canonicalSkillCount: number;
    legacySkillCount: number;
    overlappingSkillNames: string[];
    mismatchedSkillNames: string[];
}
/**
 * Installed skill directories in scope-precedence order.
 * Project skills win over user-level skills with the same directory basename.
 */
export declare function listInstalledSkillDirectories(projectRoot?: string): Promise<InstalledSkillDirectory[]>;
export declare function detectLegacySkillRootOverlap(canonicalDir?: string, legacyDir?: string): Promise<SkillRootOverlapReport>;
/** oh-my-codex state directory (.omx/state/) */
export declare function omxStateDir(projectRoot?: string): string;
/** oh-my-codex project memory file (.omx/project-memory.json) */
export declare function omxProjectMemoryPath(projectRoot?: string): string;
/** oh-my-codex notepad file (.omx/notepad.md) */
export declare function omxNotepadPath(projectRoot?: string): string;
/** oh-my-codex wiki directory (.omx/wiki/) */
export declare function omxWikiDir(projectRoot?: string): string;
/** oh-my-codex plans directory (.omx/plans/) */
export declare function omxPlansDir(projectRoot?: string): string;
/** oh-my-codex adapters directory (.omx/adapters/) */
export declare function omxAdaptersDir(projectRoot?: string): string;
/** oh-my-codex logs directory (.omx/logs/) */
export declare function omxLogsDir(projectRoot?: string): string;
/** User-scope install/update stamp path ($CODEX_HOME/.omx/install-state.json) */
export declare function omxUserInstallStampPath(codexHomeDir?: string): string;
/** Get the package root directory (where agents/, skills/, prompts/ live) */
export declare function packageRoot(): string;
//# sourceMappingURL=paths.d.ts.map