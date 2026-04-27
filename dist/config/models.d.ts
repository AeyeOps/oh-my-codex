/**
 * Model Configuration
 *
 * Reads per-mode model overrides and default-env overrides from .omx-config.json.
 *
 * Config format:
 * {
 *   "env": {
 *     "OMX_DEFAULT_FRONTIER_MODEL": "your-frontier-model",
 *     "OMX_DEFAULT_STANDARD_MODEL": "your-standard-model",
 *     "OMX_DEFAULT_SPARK_MODEL": "your-spark-model"
 *   },
 *   "models": {
 *     "default": "o4-mini",
 *     "team": "gpt-4.1"
 *   }
 * }
 *
 * Resolution: mode-specific > "default" key > OMX_DEFAULT_FRONTIER_MODEL > DEFAULT_FRONTIER_MODEL
 */
export interface ModelsConfig {
    [mode: string]: string | undefined;
}
export interface OmxConfigEnv {
    [key: string]: string | undefined;
}
export declare const OMX_DEFAULT_FRONTIER_MODEL_ENV = "OMX_DEFAULT_FRONTIER_MODEL";
export declare const OMX_DEFAULT_STANDARD_MODEL_ENV = "OMX_DEFAULT_STANDARD_MODEL";
export declare const OMX_DEFAULT_SPARK_MODEL_ENV = "OMX_DEFAULT_SPARK_MODEL";
export declare const OMX_SPARK_MODEL_ENV = "OMX_SPARK_MODEL";
export declare const OMX_TEAM_CHILD_MODEL_ENV = "OMX_TEAM_CHILD_MODEL";
export declare const DEFAULT_FRONTIER_MODEL = "gpt-5.5";
export declare const DEFAULT_STANDARD_MODEL = "gpt-5.4-mini";
export declare const DEFAULT_SPARK_MODEL = "gpt-5.3-codex-spark";
export declare const DEFAULT_TEAM_CHILD_MODEL = "gpt-5.4-mini";
export declare function readConfiguredEnvOverrides(codexHomeOverride?: string): NodeJS.ProcessEnv;
export declare function readActiveProviderEnvOverrides(env?: NodeJS.ProcessEnv, codexHomeOverride?: string): NodeJS.ProcessEnv;
export declare function getEnvConfiguredMainDefaultModel(env?: NodeJS.ProcessEnv, codexHomeOverride?: string): string | undefined;
export declare function getEnvConfiguredStandardDefaultModel(env?: NodeJS.ProcessEnv, codexHomeOverride?: string): string | undefined;
export declare function getEnvConfiguredSparkDefaultModel(env?: NodeJS.ProcessEnv, codexHomeOverride?: string): string | undefined;
export declare function getTeamChildModel(codexHomeOverride?: string): string;
/**
 * Get the envvar-backed main/default model.
 * Resolution: OMX_DEFAULT_FRONTIER_MODEL > config.toml model > DEFAULT_FRONTIER_MODEL
 */
export declare function getMainDefaultModel(codexHomeOverride?: string): string;
/**
 * Get the envvar-backed standard/default subagent model.
 *
 * Standard-role subagents inherit the configured main/default model unless an
 * explicit standard-lane override is configured. This keeps spawned agents in
 * sync with the leader model while preserving OMX_DEFAULT_STANDARD_MODEL as the
 * opt-in escape hatch for cheaper/specialized standard workers.
 *
 * Resolution: OMX_DEFAULT_STANDARD_MODEL > OMX_DEFAULT_FRONTIER_MODEL > config.toml model > DEFAULT_FRONTIER_MODEL
 */
export declare function getStandardDefaultModel(codexHomeOverride?: string): string;
/**
 * Get the configured model for a specific mode.
 * Resolution: mode-specific override > "default" key > OMX_DEFAULT_FRONTIER_MODEL > DEFAULT_FRONTIER_MODEL
 */
export declare function getModelForMode(mode: string, codexHomeOverride?: string): string;
/**
 * Get the envvar-backed spark/low-complexity default model.
 * Resolution: OMX_DEFAULT_SPARK_MODEL > OMX_SPARK_MODEL > explicit low-complexity key(s) > DEFAULT_SPARK_MODEL
 */
export declare function getSparkDefaultModel(codexHomeOverride?: string): string;
/**
 * Get the low-complexity team worker model.
 * Resolution: explicit low-complexity key(s) > OMX_DEFAULT_SPARK_MODEL > OMX_SPARK_MODEL > DEFAULT_SPARK_MODEL
 */
export declare function getTeamLowComplexityModel(codexHomeOverride?: string): string;
//# sourceMappingURL=models.d.ts.map