export interface PlanningArtifacts {
    plansDir: string;
    specsDir: string;
    prdPaths: string[];
    testSpecPaths: string[];
    deepInterviewSpecPaths: string[];
}
export interface ApprovedPlanContext {
    sourcePath: string;
    testSpecPaths: string[];
    deepInterviewSpecPaths: string[];
}
export interface ApprovedExecutionLaunchHint extends ApprovedPlanContext {
    mode: 'team' | 'ralph';
    command: string;
    task: string;
    workerCount?: number;
    agentType?: string;
    linkedRalph?: boolean;
}
export interface LatestPlanningArtifactSelection {
    prdPath: string | null;
    testSpecPaths: string[];
    deepInterviewSpecPaths: string[];
}
export declare function readPlanningArtifacts(cwd: string): PlanningArtifacts;
export declare function isPlanningComplete(artifacts: PlanningArtifacts): boolean;
export declare function selectLatestPlanningArtifacts(artifacts: PlanningArtifacts): LatestPlanningArtifactSelection;
export declare function readLatestPlanningArtifacts(cwd: string): LatestPlanningArtifactSelection;
export declare function readApprovedExecutionLaunchHint(cwd: string, mode: 'team' | 'ralph'): ApprovedExecutionLaunchHint | null;
//# sourceMappingURL=artifacts.d.ts.map