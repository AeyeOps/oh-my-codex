export interface NotifyCanonicalActiveTeam {
    teamName: string;
    phase: string;
    ownerSessionId: string;
    path: string;
    source: 'canonical_fallback';
}
export declare function listNotifyCanonicalActiveTeams(cwd: string, currentSessionId: string): Promise<NotifyCanonicalActiveTeam[]>;
//# sourceMappingURL=active-team.d.ts.map