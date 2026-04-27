export type AutoresearchValidationMode = 'mission-validator-script' | 'prompt-architect-artifact';
export interface AutoresearchCompletionStatus {
    complete: boolean;
    reason: string;
    validationMode: AutoresearchValidationMode | null;
    artifactPath: string | null;
    outputArtifactPath?: string | null;
}
export declare function normalizeAutoresearchValidationMode(value: unknown): AutoresearchValidationMode | null;
export declare function assessAutoresearchCompletionState(rawState: Record<string, unknown> | null, cwd: string): Promise<AutoresearchCompletionStatus>;
export declare function readAutoresearchModeState(cwd: string, sessionId?: string): Promise<Record<string, unknown> | null>;
export declare function readAutoresearchCompletionStatus(cwd: string, sessionId?: string): Promise<AutoresearchCompletionStatus>;
//# sourceMappingURL=skill-validation.d.ts.map