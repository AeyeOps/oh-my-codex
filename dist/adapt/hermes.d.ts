import { type AdaptBootstrapMetadata, type AdaptCapabilityReport, type AdaptEnvelope, type AdaptProbeReport, type AdaptRuntimeObservation, type AdaptStatusReport } from "./contracts.js";
interface HermesGatewayRuntimeFile {
    gateway_state?: string;
    exit_reason?: string | null;
    restart_requested?: boolean;
    active_agents?: number;
    updated_at?: string;
    platforms?: Record<string, {
        state?: string;
        error_code?: string | null;
        error_message?: string | null;
        updated_at?: string;
    }>;
    [key: string]: unknown;
}
interface HermesPidRecord {
    pid?: number;
    kind?: string;
    argv?: string[];
    start_time?: number;
    [key: string]: unknown;
}
interface HermesEvidence {
    hermesRoot: string;
    hermesHome: string;
    sources: {
        root: "override" | "sibling-default";
        home: "env" | "default";
    };
    sourceRuntime: {
        present: boolean;
        acp: {
            present: boolean;
            files: string[];
            missing: string[];
        };
        gateway: {
            present: boolean;
            files: string[];
            missing: string[];
        };
        docs: {
            present: boolean;
            files: string[];
            missing: string[];
        };
        stateStore: {
            present: boolean;
            path: string;
        };
        acpRegistry: {
            present: boolean;
            path: string;
        };
    };
    installed: boolean;
    runtimeFiles: {
        gatewayPidPath: string;
        gatewayStatePath: string;
        stateDbPath: string;
        gatewayPidReadable: boolean;
        gatewayStateReadable: boolean;
        stateDbReadable: boolean;
        stateDbExists: boolean;
    };
    gateway: {
        pidRecord: HermesPidRecord | null;
        runtimeRecord: HermesGatewayRuntimeFile | null;
        live: boolean;
        connectedPlatforms: string[];
        stale: boolean;
    };
    resumable: boolean;
}
export declare function collectHermesEvidence(cwd?: string): Promise<HermesEvidence>;
export declare function buildHermesCapabilityOverrides(capabilities: AdaptCapabilityReport[], evidence: HermesEvidence): AdaptCapabilityReport[];
export declare function buildHermesBootstrapMetadata(evidence: HermesEvidence): AdaptBootstrapMetadata;
export declare function buildHermesRuntimeObservation(evidence: HermesEvidence): AdaptRuntimeObservation;
export declare function applyHermesEnvelope(envelope: AdaptEnvelope, evidence: HermesEvidence): AdaptEnvelope;
export declare function applyHermesProbe(report: AdaptProbeReport, evidence: HermesEvidence): AdaptProbeReport;
export declare function applyHermesStatus(report: AdaptStatusReport, evidence: HermesEvidence): AdaptStatusReport;
export {};
//# sourceMappingURL=hermes.d.ts.map