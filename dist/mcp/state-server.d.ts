/**
 * OMX State Management MCP Server
 * Provides state read/write/clear/list tools for workflow modes
 * Storage: .omx/state/{mode}-state.json
 */
export declare function buildStateServerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            mode: {
                type: string;
                enum: ("ralplan" | "team" | "ralph" | "ultrawork" | "autopilot" | "autoresearch" | "ultraqa" | "deep-interview" | "skill-active")[];
                description: string;
            };
            workingDirectory: {
                type: string;
                description: string;
            };
            session_id: {
                type: string;
                description: string;
            };
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            run_outcome?: undefined;
            lifecycle_outcome?: undefined;
            terminal_outcome?: undefined;
            error?: undefined;
            state?: undefined;
            all_sessions?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            mode: {
                type: string;
                enum: ("ralplan" | "team" | "ralph" | "ultrawork" | "autopilot" | "autoresearch" | "ultraqa" | "deep-interview" | "skill-active")[];
                description?: undefined;
            };
            active: {
                type: string;
            };
            iteration: {
                type: string;
            };
            max_iterations: {
                type: string;
            };
            current_phase: {
                type: string;
            };
            task_description: {
                type: string;
            };
            started_at: {
                type: string;
            };
            completed_at: {
                type: string;
            };
            run_outcome: {
                type: string;
                enum: string[];
            };
            lifecycle_outcome: {
                type: string;
                enum: string[];
            };
            terminal_outcome: {
                type: string;
                enum: string[];
                description: string;
            };
            error: {
                type: string;
            };
            state: {
                type: string;
                description: string;
            };
            workingDirectory: {
                type: string;
                description?: undefined;
            };
            session_id: {
                type: string;
                description: string;
            };
            all_sessions?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            mode: {
                type: string;
                enum: ("ralplan" | "team" | "ralph" | "ultrawork" | "autopilot" | "autoresearch" | "ultraqa" | "deep-interview" | "skill-active")[];
                description?: undefined;
            };
            workingDirectory: {
                type: string;
                description?: undefined;
            };
            session_id: {
                type: string;
                description: string;
            };
            all_sessions: {
                type: string;
                description: string;
            };
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            run_outcome?: undefined;
            lifecycle_outcome?: undefined;
            terminal_outcome?: undefined;
            error?: undefined;
            state?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            workingDirectory: {
                type: string;
                description?: undefined;
            };
            session_id: {
                type: string;
                description: string;
            };
            mode?: undefined;
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            run_outcome?: undefined;
            lifecycle_outcome?: undefined;
            terminal_outcome?: undefined;
            error?: undefined;
            state?: undefined;
            all_sessions?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            mode: {
                type: string;
                enum: ("ralplan" | "team" | "ralph" | "ultrawork" | "autopilot" | "autoresearch" | "ultraqa" | "deep-interview" | "skill-active")[];
                description?: undefined;
            };
            workingDirectory: {
                type: string;
                description?: undefined;
            };
            session_id: {
                type: string;
                description: string;
            };
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            run_outcome?: undefined;
            lifecycle_outcome?: undefined;
            terminal_outcome?: undefined;
            error?: undefined;
            state?: undefined;
            all_sessions?: undefined;
        };
        required?: undefined;
    };
})[];
export declare function handleStateToolCall(request: {
    params: {
        name: string;
        arguments?: Record<string, unknown>;
    };
}): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=state-server.d.ts.map