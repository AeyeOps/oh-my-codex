export interface SessionSearchOptions {
    query: string;
    limit?: number;
    session?: string;
    since?: string;
    project?: string;
    context?: number;
    caseSensitive?: boolean;
    cwd?: string;
    now?: number;
    codexHomeDir?: string;
}
export interface SessionSearchResult {
    session_id: string;
    timestamp: string | null;
    cwd: string | null;
    transcript_path: string;
    transcript_path_relative: string;
    record_type: string;
    line_number: number;
    snippet: string;
}
export interface SessionSearchReport {
    query: string;
    searched_files: number;
    matched_sessions: number;
    results: SessionSearchResult[];
}
export declare function parseSinceSpec(value: string | undefined, now?: number): number | null;
export declare function searchSessionHistory(options: SessionSearchOptions): Promise<SessionSearchReport>;
//# sourceMappingURL=search.d.ts.map