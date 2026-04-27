import { existsSync, readFileSync } from 'node:fs';
import { readSessionState, readUsableSessionState } from '../hooks/session.js';
import { getSkillActiveStatePaths, readSkillActiveState } from '../state/skill-active.js';
import { readRunState } from '../runtime/run-state.js';
import { readSubagentSessionSummary } from '../subagents/tracker.js';
import type { SessionMapping } from './session-registry.js';
export declare const DISCORD_STATUS_COMMAND = "status";
export declare const DISCORD_STATUS_STALE_AFTER_MS: number;
export declare const DISCORD_STATUS_MAX_SUBAGENTS = 3;
export declare const NO_TRACKED_SESSION_MESSAGE = "No tracked OMX session is associated with this message.";
export declare const STATUS_DATA_UNAVAILABLE_MESSAGE = "Tracked OMX session found, but status data is unavailable.";
export interface SessionStatusDeps {
    now?: string | Date;
    existsSyncImpl?: typeof existsSync;
    readFileSyncImpl?: typeof readFileSync;
    readSessionStateImpl?: typeof readSessionState;
    readUsableSessionStateImpl?: typeof readUsableSessionState;
    readSubagentSessionSummaryImpl?: typeof readSubagentSessionSummary;
    getSkillActiveStatePathsImpl?: typeof getSkillActiveStatePaths;
    readSkillActiveStateImpl?: typeof readSkillActiveState;
    readRunStateImpl?: typeof readRunState;
}
export declare function isDiscordStatusCommand(input: string): boolean;
export declare function buildDiscordSessionStatusReply(mapping: SessionMapping, deps?: SessionStatusDeps): Promise<string>;
//# sourceMappingURL=session-status.d.ts.map