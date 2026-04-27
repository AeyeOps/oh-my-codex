/**
 * OpenClaw Configuration Reader
 *
 * Reads OpenClaw config from the notifications.openclaw key in ~/.codex/.omx-config.json.
 * Also supports generic alias shapes under notifications.custom_cli_command
 * and notifications.custom_webhook_command, normalized to OpenClaw runtime config.
 *
 * Config is cached after first read (env vars don't change during process lifetime).
 * Config file path can be overridden via OMX_OPENCLAW_CONFIG env var (points to a separate file).
 */
import type { OpenClawConfig, OpenClawGatewayConfig, OpenClawHookEvent } from "./types.js";
export type OpenClawConfigInspectionState = "configured" | "disabled" | "missing-config" | "invalid-config" | "not-configured";
export type OpenClawConfigSource = "env-override" | "notifications.openclaw" | "custom-aliases";
export interface OpenClawConfigInspection {
    state: OpenClawConfigInspectionState;
    activationGateEnabled: boolean;
    commandGateEnabled: boolean;
    configPath: string;
    configExists: boolean;
    configSource: OpenClawConfigSource | null;
    explicitConfigPresent: boolean;
    aliasConfigPresent: boolean;
    aliasSources: Array<"custom_cli_command" | "custom_webhook_command">;
    explicitOverridesAliases: boolean;
    warnings: string[];
    detail: string;
    config: OpenClawConfig | null;
}
export declare function inspectOpenClawConfig(env?: NodeJS.ProcessEnv): OpenClawConfigInspection;
/**
 * Read and cache the OpenClaw configuration.
 *
 * Returns null when:
 * - OMX_OPENCLAW env var is not "1"
 * - Config file does not exist
 * - Config file is invalid JSON
 * - Config has enabled: false
 *
 * Config is read from:
 * 1. OMX_OPENCLAW_CONFIG env var path (separate file), if set
 * 2. notifications.openclaw key in ~/.codex/.omx-config.json
 * 3. notifications.custom_cli_command / notifications.custom_webhook_command aliases
 */
export declare function getOpenClawConfig(): OpenClawConfig | null;
/**
 * Resolve gateway config for a specific hook event.
 * Returns null if the event is not mapped or disabled.
 * Returns the gateway name alongside config to avoid O(n) reverse lookup.
 */
export declare function resolveGateway(config: OpenClawConfig, event: OpenClawHookEvent): {
    gatewayName: string;
    gateway: OpenClawGatewayConfig;
    instruction: string;
} | null;
/**
 * Reset the config cache (for testing only).
 */
export declare function resetOpenClawConfigCache(): void;
//# sourceMappingURL=config.d.ts.map