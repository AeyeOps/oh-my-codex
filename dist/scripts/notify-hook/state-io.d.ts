/**
 * State file I/O helpers for notify-hook modules.
 */
import { readdir } from 'fs/promises';
export { readdir };
export declare function readJsonIfExists(path: string, fallback: any): Promise<any>;
export declare function readCurrentSessionId(baseStateDir: string): Promise<string | undefined>;
export declare function resolveScopedStateDir(baseStateDir: string, explicitSessionId?: string): Promise<string>;
export declare function getScopedStateDirsForCurrentSession(baseStateDir: string, explicitSessionId?: string, options?: {
    includeRootFallback?: boolean;
}): Promise<string[]>;
export declare function getScopedStatePath(baseStateDir: string, fileName: string, explicitSessionId?: string): Promise<string>;
export declare function readScopedJsonIfExists(baseStateDir: string, fileName: string, explicitSessionId: string | undefined, fallback: any, options?: {
    includeRootFallback?: boolean;
}): Promise<any>;
export declare function writeScopedJson(baseStateDir: string, fileName: string, explicitSessionId: string | undefined, value: unknown): Promise<void>;
export declare function normalizeTmuxState(raw: any): any;
export declare function normalizeNotifyState(raw: any): any;
export declare function pruneRecentTurns(recentTurns: any, now: number): Record<string, number>;
export declare function pruneRecentKeys(recentKeys: any, now: number): Record<string, number>;
//# sourceMappingURL=state-io.d.ts.map