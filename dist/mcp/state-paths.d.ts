export declare const SESSION_ID_PATTERN: RegExp;
export declare const STATE_MODE_SEGMENT_PATTERN: RegExp;
export type StateFileScope = 'root' | 'session';
export interface ModeStateFileRef {
    mode: string;
    path: string;
    scope: StateFileScope;
}
export declare function validateSessionId(sessionId: unknown): string | undefined;
export declare function validateStateModeSegment(mode: unknown): string;
export declare function validateStateFileName(fileName: unknown): string;
export declare function resolveWorkingDirectoryForState(workingDirectory?: string): string;
export declare function getBaseStateDir(workingDirectory?: string): string;
export declare function getStateDir(workingDirectory?: string, sessionId?: string): string;
export declare function getStatePath(mode: string, workingDirectory?: string, sessionId?: string): string;
export declare function getStateFilePath(fileName: string, workingDirectory?: string, sessionId?: string): string;
export type StateScopeSource = 'explicit' | 'session' | 'root';
export interface ResolvedStateScope {
    source: StateScopeSource;
    sessionId?: string;
    stateDir: string;
}
export declare function readCurrentSessionId(workingDirectory?: string): Promise<string | undefined>;
export declare function resolveStateScope(workingDirectory?: string, explicitSessionId?: string): Promise<ResolvedStateScope>;
/**
 * Read scope precedence:
 * - explicit session_id => session path only
 * - implicit current session => session path first, root as compatibility fallback
 * - no session => root path only
 */
export declare function getReadScopedStateDirs(workingDirectory?: string, explicitSessionId?: string): Promise<string[]>;
export declare function getReadScopedStatePaths(mode: string, workingDirectory?: string, explicitSessionId?: string): Promise<string[]>;
export declare function getReadScopedStateFilePaths(fileName: string, workingDirectory?: string, explicitSessionId?: string, options?: {
    rootFallback?: boolean;
}): Promise<string[]>;
export declare function getAllSessionScopedStatePaths(mode: string, workingDirectory?: string): Promise<string[]>;
export declare function getAllScopedStatePaths(mode: string, workingDirectory?: string): Promise<string[]>;
export declare function getAllSessionScopedStateDirs(workingDirectory?: string): Promise<string[]>;
export declare function getAllScopedStateDirs(workingDirectory?: string): Promise<string[]>;
export declare function isModeStateFilename(filename: string): boolean;
export declare function listModeStateFilesWithScopePreference(workingDirectory?: string, explicitSessionId?: string): Promise<ModeStateFileRef[]>;
//# sourceMappingURL=state-paths.d.ts.map