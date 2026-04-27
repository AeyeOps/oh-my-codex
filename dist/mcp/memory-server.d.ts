/**
 * OMX Project Memory & Notepad MCP Server
 * Provides persistent project memory and session notepad tools
 * Storage: .omx/project-memory.json, .omx/notepad.md
 */
export declare function buildMemoryServerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            section: {
                type: string;
                enum: string[];
            };
            workingDirectory: {
                type: string;
            };
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            content?: undefined;
            directive?: undefined;
            priority?: undefined;
            context?: undefined;
            daysOld?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            memory: {
                type: string;
                description: string;
            };
            merge: {
                type: string;
                description: string;
            };
            workingDirectory: {
                type: string;
            };
            section?: undefined;
            category?: undefined;
            content?: undefined;
            directive?: undefined;
            priority?: undefined;
            context?: undefined;
            daysOld?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            category: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            workingDirectory: {
                type: string;
            };
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            directive?: undefined;
            priority?: undefined;
            context?: undefined;
            daysOld?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directive: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                enum: string[];
            };
            context: {
                type: string;
            };
            workingDirectory: {
                type: string;
            };
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            content?: undefined;
            daysOld?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            content: {
                type: string;
                description: string;
            };
            workingDirectory: {
                type: string;
            };
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            directive?: undefined;
            priority?: undefined;
            context?: undefined;
            daysOld?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            daysOld: {
                type: string;
                minimum: number;
                description: string;
            };
            workingDirectory: {
                type: string;
            };
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            content?: undefined;
            directive?: undefined;
            priority?: undefined;
            context?: undefined;
        };
        required?: undefined;
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
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            content?: undefined;
            directive?: undefined;
            priority?: undefined;
            context?: undefined;
            daysOld?: undefined;
        };
        required?: undefined;
    };
})[];
export declare function handleMemoryToolCall(request: {
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
//# sourceMappingURL=memory-server.d.ts.map