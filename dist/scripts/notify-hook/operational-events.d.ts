export declare function resolveOperationalSessionName(cwd: any, sessionId?: string, sessionName?: string): string | undefined;
export declare function readRepositoryMetadata(cwd: any): any;
export declare function extractIssueNumber(text: any): number | undefined;
export declare function extractPrInfo(text: any): any;
export declare function extractErrorSummary(text: any, maxLength?: number): string | undefined;
export declare function parseExecCommandArgs(rawArguments: any): {
    command: string;
    workdir: string;
};
export declare function classifyExecCommand(command: any): any;
export declare function parseCommandResult(rawOutput: any): any;
export declare function buildOperationalContext({ cwd, normalizedEvent, sessionId, sessionName, text, output, command, toolName, status, issueNumber, prNumber, prUrl, errorSummary, extra, }: any): any;
export declare function deriveAssistantSignalEvents(message: any): any[];
//# sourceMappingURL=operational-events.d.ts.map