/**
 * Triage Feature Gate Config Reader
 *
 * Reads promptRouting.triage.enabled from codexHome()/.omx-config.json.
 * Defaults to enabled when the config file is absent or the triage flag is
 * omitted from an otherwise valid config object (rollout default).
 * Fails closed (enabled: false) when the file exists but is malformed.
 */
export type TriageConfigStatus = "enabled" | "disabled" | "defaulted" | "invalid";
export interface TriageConfig {
    enabled: boolean;
    status: TriageConfigStatus;
    source: "default" | "file" | "invalid";
    path: string;
}
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
export declare function readTriageConfig(): TriageConfig;
/**
 * Clear the cached triage config. Call in tests to reset state.
 */
export declare function resetTriageConfigCache(): void;
//# sourceMappingURL=triage-config.d.ts.map