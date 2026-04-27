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
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { codexHome } from "../utils/paths.js";
/** Cached config (null = not yet read, undefined = read but file missing/invalid) */
let _cachedConfig = null;
const VALID_HOOK_EVENTS = [
    "session-start",
    "session-end",
    "session-idle",
    "ask-user-question",
    "stop",
];
const DEFAULT_ALIAS_EVENTS = [
    "session-end",
    "ask-user-question",
];
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
}
function parseEvents(value) {
    if (!Array.isArray(value))
        return [...DEFAULT_ALIAS_EVENTS];
    const events = value.filter((entry) => typeof entry === "string" &&
        VALID_HOOK_EVENTS.includes(entry));
    return events.length > 0 ? events : [...DEFAULT_ALIAS_EVENTS];
}
function parseInstruction(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function normalizeFromCustomAliases(notifications) {
    const webhookAlias = asRecord(notifications.custom_webhook_command);
    const cliAlias = asRecord(notifications.custom_cli_command);
    const sources = [];
    const webhookEnabled = webhookAlias?.enabled !== false && typeof webhookAlias?.url === "string";
    const cliEnabled = cliAlias?.enabled !== false && typeof cliAlias?.command === "string";
    if (!webhookEnabled && !cliEnabled) {
        return { config: null, sources };
    }
    const gateways = {};
    const hooks = {};
    const applyHooks = (events, gateway, instruction, source) => {
        for (const event of events) {
            if (hooks[event]) {
                console.warn(`[openclaw] warning: ${source} overrides existing mapping for event '${event}'`);
            }
            hooks[event] = {
                enabled: true,
                gateway,
                instruction,
            };
        }
    };
    if (cliEnabled && cliAlias) {
        sources.push("custom_cli_command");
        const gatewayName = typeof cliAlias.gateway === "string" && cliAlias.gateway.trim()
            ? cliAlias.gateway.trim()
            : "custom-cli";
        gateways[gatewayName] = {
            type: "command",
            command: cliAlias.command.trim(),
            ...(typeof cliAlias.timeout === "number"
                ? { timeout: cliAlias.timeout }
                : {}),
        };
        applyHooks(parseEvents(cliAlias.events), gatewayName, parseInstruction(cliAlias.instruction, "OMX event {{event}} for {{projectPath}}"), "custom_cli_command");
    }
    if (webhookEnabled && webhookAlias) {
        sources.push("custom_webhook_command");
        const gatewayName = typeof webhookAlias.gateway === "string" && webhookAlias.gateway.trim()
            ? webhookAlias.gateway.trim()
            : "custom-webhook";
        const method = webhookAlias.method === "PUT" ? "PUT" : "POST";
        gateways[gatewayName] = {
            type: "http",
            url: webhookAlias.url.trim(),
            method,
            ...(typeof webhookAlias.timeout === "number"
                ? { timeout: webhookAlias.timeout }
                : {}),
            ...(asRecord(webhookAlias.headers)
                ? { headers: webhookAlias.headers }
                : {}),
        };
        applyHooks(parseEvents(webhookAlias.events), gatewayName, parseInstruction(webhookAlias.instruction, "OMX event {{event}} for {{projectPath}}"), "custom_webhook_command");
    }
    if (Object.keys(gateways).length === 0 || Object.keys(hooks).length === 0) {
        return { config: null, sources };
    }
    return {
        config: {
            enabled: true,
            gateways,
            hooks,
        },
        sources,
    };
}
function isValidOpenClawConfig(raw) {
    return Boolean(raw?.enabled && raw.gateways && raw.hooks);
}
function defaultOmxConfigPath() {
    return join(codexHome(), ".omx-config.json");
}
export function inspectOpenClawConfig(env = process.env) {
    const activationGateEnabled = env.OMX_OPENCLAW === "1";
    const commandGateEnabled = env.OMX_OPENCLAW_COMMAND === "1";
    const envOverride = env.OMX_OPENCLAW_CONFIG?.trim();
    const configPath = envOverride || defaultOmxConfigPath();
    const configExists = existsSync(configPath);
    if (!activationGateEnabled) {
        return {
            state: "disabled",
            activationGateEnabled,
            commandGateEnabled,
            configPath,
            configExists,
            configSource: null,
            explicitConfigPresent: false,
            aliasConfigPresent: false,
            aliasSources: [],
            explicitOverridesAliases: false,
            warnings: [],
            detail: "OpenClaw is disabled locally because OMX_OPENCLAW=1 is not set.",
            config: null,
        };
    }
    if (!configExists) {
        return {
            state: "missing-config",
            activationGateEnabled,
            commandGateEnabled,
            configPath,
            configExists,
            configSource: null,
            explicitConfigPresent: false,
            aliasConfigPresent: false,
            aliasSources: [],
            explicitOverridesAliases: false,
            warnings: [],
            detail: envOverride
                ? `OMX_OPENCLAW_CONFIG points to ${configPath}, but the file does not exist.`
                : `No OpenClaw config file was found at ${configPath}.`,
            config: null,
        };
    }
    try {
        if (envOverride) {
            const raw = JSON.parse(readFileSync(configPath, "utf-8"));
            if (!isValidOpenClawConfig(raw)) {
                return {
                    state: "invalid-config",
                    activationGateEnabled,
                    commandGateEnabled,
                    configPath,
                    configExists,
                    configSource: null,
                    explicitConfigPresent: false,
                    aliasConfigPresent: false,
                    aliasSources: [],
                    explicitOverridesAliases: false,
                    warnings: [],
                    detail: "OMX_OPENCLAW_CONFIG is present but does not contain a valid OpenClaw config.",
                    config: null,
                };
            }
            return {
                state: "configured",
                activationGateEnabled,
                commandGateEnabled,
                configPath,
                configExists,
                configSource: "env-override",
                explicitConfigPresent: false,
                aliasConfigPresent: false,
                aliasSources: [],
                explicitOverridesAliases: false,
                warnings: [],
                detail: "OpenClaw config loaded from OMX_OPENCLAW_CONFIG.",
                config: raw,
            };
        }
        const fullConfig = JSON.parse(readFileSync(configPath, "utf-8"));
        const notifications = asRecord(fullConfig.notifications);
        if (!notifications) {
            return {
                state: "not-configured",
                activationGateEnabled,
                commandGateEnabled,
                configPath,
                configExists,
                configSource: null,
                explicitConfigPresent: false,
                aliasConfigPresent: false,
                aliasSources: [],
                explicitOverridesAliases: false,
                warnings: [],
                detail: "The OMX config file exists, but notifications are not configured.",
                config: null,
            };
        }
        const explicitOpenClaw = notifications.openclaw;
        const explicitConfigPresent = explicitOpenClaw !== undefined;
        const aliasInspection = normalizeFromCustomAliases(notifications);
        const aliasConfigPresent = aliasInspection.config !== null;
        if (isValidOpenClawConfig(explicitOpenClaw)) {
            const explicitOverridesAliases = aliasInspection.config !== null;
            return {
                state: "configured",
                activationGateEnabled,
                commandGateEnabled,
                configPath,
                configExists,
                configSource: "notifications.openclaw",
                explicitConfigPresent,
                aliasConfigPresent,
                aliasSources: aliasInspection.sources,
                explicitOverridesAliases,
                warnings: explicitOverridesAliases
                    ? [
                        "notifications.openclaw overrides custom_cli_command/custom_webhook_command aliases.",
                    ]
                    : [],
                detail: "OpenClaw config loaded from notifications.openclaw.",
                config: explicitOpenClaw,
            };
        }
        if (aliasInspection.config) {
            return {
                state: "configured",
                activationGateEnabled,
                commandGateEnabled,
                configPath,
                configExists,
                configSource: "custom-aliases",
                explicitConfigPresent,
                aliasConfigPresent,
                aliasSources: aliasInspection.sources,
                explicitOverridesAliases: false,
                warnings: [],
                detail: "OpenClaw config was synthesized from custom notification aliases.",
                config: aliasInspection.config,
            };
        }
        return {
            state: explicitConfigPresent ? "invalid-config" : "not-configured",
            activationGateEnabled,
            commandGateEnabled,
            configPath,
            configExists,
            configSource: null,
            explicitConfigPresent,
            aliasConfigPresent: aliasInspection.sources.length > 0,
            aliasSources: aliasInspection.sources,
            explicitOverridesAliases: false,
            warnings: [],
            detail: explicitConfigPresent || aliasInspection.sources.length > 0
                ? "OpenClaw config keys exist, but they do not form a valid runtime config."
                : "No OpenClaw-specific config or aliases were found in notifications.",
            config: null,
        };
    }
    catch {
        return {
            state: "invalid-config",
            activationGateEnabled,
            commandGateEnabled,
            configPath,
            configExists,
            configSource: null,
            explicitConfigPresent: false,
            aliasConfigPresent: false,
            aliasSources: [],
            explicitOverridesAliases: false,
            warnings: [],
            detail: "OpenClaw config exists but could not be parsed as JSON.",
            config: null,
        };
    }
}
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
export function getOpenClawConfig() {
    // Activation gate: only active when OMX_OPENCLAW=1
    if (process.env.OMX_OPENCLAW !== "1") {
        return null;
    }
    // Return cached result
    if (_cachedConfig !== null) {
        return _cachedConfig ?? null;
    }
    try {
        const envOverride = process.env.OMX_OPENCLAW_CONFIG;
        if (envOverride) {
            // OMX_OPENCLAW_CONFIG points to a separate config file
            if (!existsSync(envOverride)) {
                _cachedConfig = undefined;
                return null;
            }
            const raw = JSON.parse(readFileSync(envOverride, "utf-8"));
            if (!isValidOpenClawConfig(raw)) {
                _cachedConfig = undefined;
                return null;
            }
            _cachedConfig = raw;
            return raw;
        }
        // Primary: read from notifications block in .omx-config.json
        const omxConfigPath = defaultOmxConfigPath();
        if (!existsSync(omxConfigPath)) {
            _cachedConfig = undefined;
            return null;
        }
        const fullConfig = JSON.parse(readFileSync(omxConfigPath, "utf-8"));
        const notifications = asRecord(fullConfig.notifications);
        if (!notifications) {
            _cachedConfig = undefined;
            return null;
        }
        const explicitOpenClaw = notifications.openclaw;
        const aliasOpenClaw = normalizeFromCustomAliases(notifications);
        if (isValidOpenClawConfig(explicitOpenClaw)) {
            if (aliasOpenClaw.config) {
                console.warn("[openclaw] warning: notifications.openclaw is set; ignoring custom_cli_command/custom_webhook_command aliases");
            }
            _cachedConfig = explicitOpenClaw;
            return explicitOpenClaw;
        }
        if (aliasOpenClaw.config) {
            _cachedConfig = aliasOpenClaw.config;
            return aliasOpenClaw.config;
        }
        _cachedConfig = undefined;
        return null;
    }
    catch {
        _cachedConfig = undefined;
        return null;
    }
}
/**
 * Resolve gateway config for a specific hook event.
 * Returns null if the event is not mapped or disabled.
 * Returns the gateway name alongside config to avoid O(n) reverse lookup.
 */
export function resolveGateway(config, event) {
    const mapping = config.hooks[event];
    if (!mapping || !mapping.enabled) {
        return null;
    }
    const gateway = config.gateways[mapping.gateway];
    if (!gateway) {
        return null;
    }
    // Validate based on gateway type
    if (gateway.type === "command") {
        if (!gateway.command)
            return null;
    }
    else {
        // HTTP gateway (default when type is absent or "http")
        if (!("url" in gateway) || !gateway.url)
            return null;
    }
    return {
        gatewayName: mapping.gateway,
        gateway,
        instruction: mapping.instruction,
    };
}
/**
 * Reset the config cache (for testing only).
 */
export function resetOpenClawConfigCache() {
    _cachedConfig = null;
}
//# sourceMappingURL=config.js.map