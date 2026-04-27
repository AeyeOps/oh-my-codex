/**
 * OMX Wiki MCP Server
 */
export declare function buildWikiServerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                maxLength: number;
            };
            content: {
                type: string;
                maxLength: number;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                    maxLength: number;
                };
                maxItems: number;
            };
            category: {
                type: string;
                enum: ("architecture" | "decision" | "pattern" | "debugging" | "environment" | "session-log" | "reference" | "convention")[];
            };
            sources: {
                type: string;
                items: {
                    type: string;
                    maxLength: number;
                };
                maxItems: number;
            };
            confidence: {
                type: string;
                enum: string[];
            };
            workingDirectory: {
                type: string;
            };
            query?: undefined;
            limit?: undefined;
            page?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                    maxLength?: undefined;
                };
                maxItems?: undefined;
            };
            category: {
                type: string;
                enum: ("architecture" | "decision" | "pattern" | "debugging" | "environment" | "session-log" | "reference" | "convention")[];
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
            };
            workingDirectory: {
                type: string;
            };
            title?: undefined;
            content?: undefined;
            sources?: undefined;
            confidence?: undefined;
            page?: undefined;
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
            };
            title?: undefined;
            content?: undefined;
            tags?: undefined;
            category?: undefined;
            sources?: undefined;
            confidence?: undefined;
            query?: undefined;
            limit?: undefined;
            page?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                maxLength: number;
            };
            content: {
                type: string;
                maxLength: number;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                    maxLength: number;
                };
                maxItems: number;
            };
            category: {
                type: string;
                enum: ("architecture" | "decision" | "pattern" | "debugging" | "environment" | "session-log" | "reference" | "convention")[];
            };
            workingDirectory: {
                type: string;
            };
            sources?: undefined;
            confidence?: undefined;
            query?: undefined;
            limit?: undefined;
            page?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            page: {
                type: string;
            };
            workingDirectory: {
                type: string;
            };
            title?: undefined;
            content?: undefined;
            tags?: undefined;
            category?: undefined;
            sources?: undefined;
            confidence?: undefined;
            query?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleWikiToolCall(request: {
    params: {
        name: string;
        arguments?: Record<string, unknown>;
    };
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=wiki-server.d.ts.map