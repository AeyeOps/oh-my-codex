import type { AdaptCapabilityReport, AdaptDoctorReport, AdaptEnvelope, AdaptInitResult, AdaptPathSet, AdaptPlanningLink, AdaptProbeReport, AdaptStatusReport } from "./contracts.js";
export declare function buildOpenClawEnvelope(paths: AdaptPathSet, planning: AdaptPlanningLink, capabilities: AdaptCapabilityReport[], now: Date): AdaptEnvelope;
export declare function buildOpenClawProbeReport(paths: AdaptPathSet, planning: AdaptPlanningLink, capabilities: AdaptCapabilityReport[], now: Date): AdaptProbeReport;
export declare function buildOpenClawStatusReport(paths: AdaptPathSet, planning: AdaptPlanningLink, capabilities: AdaptCapabilityReport[], now: Date): AdaptStatusReport;
export declare function buildOpenClawDoctorReport(paths: AdaptPathSet, planning: AdaptPlanningLink, now: Date): AdaptDoctorReport;
export declare function initOpenClawFoundation(paths: AdaptPathSet, planning: AdaptPlanningLink, capabilities: AdaptCapabilityReport[], write: boolean, now: Date): AdaptInitResult;
//# sourceMappingURL=openclaw.d.ts.map