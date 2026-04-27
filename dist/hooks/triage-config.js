/**
 * Triage Feature Gate Config Reader
 *
 * Reads promptRouting.triage.enabled from codexHome()/.omx-config.json.
 * Defaults to enabled when the config file is absent or the triage flag is
 * omitted from an otherwise valid config object (rollout default).
 * Fails closed (enabled: false) when the file exists but is malformed.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { codexHome } from "../utils/paths.js";
/** Cached triage config. `undefined` = not yet read. */
let cachedTriageConfig;
/**
 * Read and cache the triage feature gate config.
 *
 * Source: promptRouting.triage.enabled in codexHome()/.omx-config.json
 *
 * - Missing file → enabled: true, status: "defaulted" (rollout default)
 * - Valid object that omits promptRouting.triage.enabled → enabled: true, status: "defaulted"
 * - File with enabled: true → enabled: true, status: "enabled"
 * - File with enabled: false → enabled: false, status: "disabled"
 * - Malformed JSON or wrong shape → enabled: false, status: "invalid" (fail closed)
 * - Caches result for the process lifetime
 */
export function readTriageConfig() {
    if (cachedTriageConfig !== undefined)
        return cachedTriageConfig;
    const path = join(codexHome(), ".omx-config.json");
    if (!existsSync(path)) {
        cachedTriageConfig = { enabled: true, status: "defaulted", source: "default", path };
        return cachedTriageConfig;
    }
    try {
        const raw = JSON.parse(readFileSync(path, "utf-8"));
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            cachedTriageConfig = { enabled: false, status: "invalid", source: "invalid", path };
            return cachedTriageConfig;
        }
        const root = raw;
        const promptRouting = root["promptRouting"];
        if (promptRouting === undefined) {
            cachedTriageConfig = { enabled: true, status: "defaulted", source: "default", path };
            return cachedTriageConfig;
        }
        if (!promptRouting || typeof promptRouting !== "object" || Array.isArray(promptRouting)) {
            cachedTriageConfig = { enabled: false, status: "invalid", source: "invalid", path };
            return cachedTriageConfig;
        }
        const triage = promptRouting["triage"];
        if (triage === undefined) {
            cachedTriageConfig = { enabled: true, status: "defaulted", source: "default", path };
            return cachedTriageConfig;
        }
        if (!triage || typeof triage !== "object" || Array.isArray(triage)) {
            cachedTriageConfig = { enabled: false, status: "invalid", source: "invalid", path };
            return cachedTriageConfig;
        }
        const triageEnabled = triage["enabled"];
        if (triageEnabled === undefined) {
            cachedTriageConfig = { enabled: true, status: "defaulted", source: "default", path };
            return cachedTriageConfig;
        }
        if (typeof triageEnabled !== "boolean") {
            cachedTriageConfig = { enabled: false, status: "invalid", source: "invalid", path };
            return cachedTriageConfig;
        }
        cachedTriageConfig = {
            enabled: triageEnabled,
            status: triageEnabled ? "enabled" : "disabled",
            source: "file",
            path,
        };
        return cachedTriageConfig;
    }
    catch {
        cachedTriageConfig = { enabled: false, status: "invalid", source: "invalid", path };
        return cachedTriageConfig;
    }
}
/**
 * Clear the cached triage config. Call in tests to reset state.
 */
export function resetTriageConfigCache() {
    cachedTriageConfig = undefined;
}
//# sourceMappingURL=triage-config.js.map