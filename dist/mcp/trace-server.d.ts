/**
 * OMX Trace MCP Server
 * Provides trace timeline and summary tools for debugging agent flows.
 * Reads .omx/logs/ turn JSONL files produced by the notify hook.
 */
interface TraceEntry {
    timestamp: string;
    type: string;
    thread_id?: string;
    turn_id?: string;
    input_preview?: string;
    output_preview?: string;
}
export declare function readLogFiles(logsDir: string, last?: number): Promise<TraceEntry[]>;
interface LogSummary {
    totalTurns: number;
    turnsByType: Record<string, number>;
    firstTimestamp: string | null;
    lastTimestamp: string | null;
}
export declare function summarizeLogFiles(logsDir: string): Promise<LogSummary>;
interface ModeEvent {
    timestamp: string;
    event: string;
    mode: string;
    details?: Record<string, unknown>;
}
export declare function readModeEvents(workingDirectory: string): Promise<ModeEvent[]>;
export declare function buildTraceServerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            last: {
                type: string;
                description: string;
            };
            filter: {
                type: string;
                enum: string[];
                description: string;
            };
            workingDirectory: {
                type: string;
            };
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            workingDirectory: {
                type: string;
            };
            last?: undefined;
            filter?: undefined;
        };
    };
})[];
export declare function handleTraceToolCall(request: {
    params: {
        name: string;
        arguments?: Record<string, unknown>;
    };
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
export {};
//# sourceMappingURL=trace-server.d.ts.map