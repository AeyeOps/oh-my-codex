import { type AdaptDoctorReport, type AdaptEnvelope, type AdaptInitResult, type AdaptPlanningLink, type AdaptProbeReport, type AdaptStatusReport, type AdaptTarget } from "./contracts.js";
export declare function supportedAdaptTargets(): string[];
export declare function buildAdaptPlanningLink(cwd: string): AdaptPlanningLink;
export declare function buildAdaptEnvelope(cwd: string, target: AdaptTarget, now?: Date): AdaptEnvelope;
export declare function buildAdaptEnvelopeForTarget(cwd: string, target: AdaptTarget, now?: Date): Promise<AdaptEnvelope>;
export declare function buildAdaptProbeReport(cwd: string, target: AdaptTarget, now?: Date): AdaptProbeReport;
export declare function buildAdaptProbeReportForTarget(cwd: string, target: AdaptTarget, now?: Date): Promise<AdaptProbeReport>;
export declare function buildAdaptStatusReport(cwd: string, target: AdaptTarget, now?: Date): AdaptStatusReport;
export declare function buildAdaptStatusReportForTarget(cwd: string, target: AdaptTarget, now?: Date): Promise<AdaptStatusReport>;
export declare function buildAdaptDoctorReport(cwd: string, target: AdaptTarget, now?: Date): AdaptDoctorReport;
export declare function buildAdaptDoctorReportForTarget(cwd: string, target: AdaptTarget, now?: Date): Promise<AdaptDoctorReport>;
export declare function initAdaptFoundation(cwd: string, target: AdaptTarget, write?: boolean, now?: Date): AdaptInitResult;
export declare function initAdaptFoundationForTarget(cwd: string, target: AdaptTarget, write?: boolean, now?: Date): Promise<AdaptInitResult>;
//# sourceMappingURL=index.d.ts.map