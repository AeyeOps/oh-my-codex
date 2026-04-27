/**
 * OMX HUD - State file readers
 *
 * Reads .omx/state/ files to build HUD render context.
 */
import type { RalphStateForHud, UltraworkStateForHud, AutopilotStateForHud, RalplanStateForHud, DeepInterviewStateForHud, AutoresearchStateForHud, UltraqaStateForHud, TeamStateForHud, HudMetrics, HudNotifyState, HudConfig, HudRenderContext, SessionStateForHud, ResolvedHudConfig } from './types.js';
export declare function normalizeHudConfig(raw: HudConfig | null | undefined): ResolvedHudConfig;
export declare function readRalphState(cwd: string): Promise<RalphStateForHud | null>;
export declare function readUltraworkState(cwd: string): Promise<UltraworkStateForHud | null>;
export declare function readAutopilotState(cwd: string): Promise<AutopilotStateForHud | null>;
export declare function readRalplanState(cwd: string): Promise<RalplanStateForHud | null>;
export declare function readDeepInterviewState(cwd: string): Promise<DeepInterviewStateForHud | null>;
export declare function readAutoresearchState(cwd: string): Promise<AutoresearchStateForHud | null>;
export declare function readUltraqaState(cwd: string): Promise<UltraqaStateForHud | null>;
export declare function readTeamState(cwd: string): Promise<TeamStateForHud | null>;
export declare function readMetrics(cwd: string): Promise<HudMetrics | null>;
export declare function readHudNotifyState(cwd: string): Promise<HudNotifyState | null>;
export declare function readSessionState(cwd: string): Promise<SessionStateForHud | null>;
export declare function readHudConfig(cwd: string): Promise<ResolvedHudConfig>;
export declare function readVersion(): string | null;
export type GitRunner = (cwd: string, args: string[]) => string | null;
export declare function readGitBranch(cwd: string): string | null;
export declare function buildGitBranchLabel(cwd: string, config?: ResolvedHudConfig, gitRunner?: GitRunner): string | null;
/** Read all state files and build the full render context */
export declare function readAllState(cwd: string, config?: ResolvedHudConfig): Promise<HudRenderContext>;
//# sourceMappingURL=state.d.ts.map