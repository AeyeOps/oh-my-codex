interface RalphSessionResumeHooks {
    afterLockAcquired?: () => Promise<void> | void;
    afterTargetWrite?: () => Promise<void> | void;
}
interface RalphSessionResumeParams {
    stateDir: string;
    payloadSessionId: string;
    payloadThreadId?: string;
    env?: NodeJS.ProcessEnv;
    hooks?: RalphSessionResumeHooks;
}
export interface RalphSessionResumeResult {
    currentOmxSessionId: string;
    resumed: boolean;
    updatedCurrentOwner: boolean;
    reason: string;
    sourcePath?: string;
    targetPath?: string;
}
export declare function reconcileRalphSessionResume({ stateDir, payloadSessionId, payloadThreadId, env, hooks, }: RalphSessionResumeParams): Promise<RalphSessionResumeResult>;
export {};
//# sourceMappingURL=ralph-session-resume.d.ts.map