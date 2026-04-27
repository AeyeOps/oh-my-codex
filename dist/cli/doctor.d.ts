/**
 * omx doctor - Validate oh-my-codex installation
 */
interface DoctorOptions {
    verbose?: boolean;
    force?: boolean;
    dryRun?: boolean;
    team?: boolean;
}
interface Check {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
}
export declare function doctor(options?: DoctorOptions): Promise<void>;
export declare function checkExploreHarness(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): Check;
export {};
//# sourceMappingURL=doctor.d.ts.map