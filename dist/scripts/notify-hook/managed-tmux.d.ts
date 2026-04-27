export declare function buildExpectedManagedTmuxSessionName(cwd: string, sessionId: string): string;
export declare function resolveInvocationSessionId(payload: any): string;
export declare function resolveManagedSessionContext(cwd: string, payload: any, { allowTeamWorker }?: {
    allowTeamWorker?: boolean | undefined;
}): Promise<any>;
export declare function isManagedOmxSession(cwd: string, payload: any, options?: {
    allowTeamWorker?: boolean;
}): Promise<boolean>;
export declare function verifyManagedPaneTarget(paneId: string, cwd: string, payload: any, { allowTeamWorker }?: {
    allowTeamWorker?: boolean | undefined;
}): Promise<any>;
export declare function resolveManagedCurrentPane(cwd: string, payload: any, { allowTeamWorker }?: {
    allowTeamWorker?: boolean | undefined;
}): Promise<string>;
export declare function resolveManagedSessionPane(cwd: string, payload: any): Promise<string>;
export declare function resolveManagedPaneFromAnchor(anchorPane: string, cwd: string, payload: any, { allowTeamWorker }?: {
    allowTeamWorker?: boolean | undefined;
}): Promise<string>;
//# sourceMappingURL=managed-tmux.d.ts.map