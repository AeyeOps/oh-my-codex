/**
 * OMX Code Intelligence MCP Server
 * Provides LSP-like diagnostics, symbol search, and AST pattern matching.
 * Uses pragmatic CLI wrappers (tsc, ast-grep/sg) rather than full LSP protocol.
 */
interface Diagnostic {
    file: string;
    line: number;
    character: number;
    severity: 'error' | 'warning';
    code: string;
    message: string;
}
type ExecResult = {
    stdout: string;
    stderr: string;
};
type ExecRunner = (cmd: string, args: string[], options?: {
    cwd?: string;
    timeout?: number;
}) => Promise<ExecResult>;
export declare function runTscDiagnostics(target: string, projectDir: string, severity?: string, runCommand?: ExecRunner): Promise<{
    diagnostics: Diagnostic[];
    command: string;
}>;
interface AstGrepRunOptions {
    path?: string;
    maxResults?: number;
    context?: number;
    replacement?: string;
    dryRun?: boolean;
}
export declare function buildAstGrepRunArgs(pattern: string, language: string, options: AstGrepRunOptions): string[];
export declare function buildCodeIntelServerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            severity: {
                type: string;
                enum: string[];
            };
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directory: {
                type: string;
                description: string;
            };
            strategy: {
                type: string;
                enum: string[];
                description: string;
            };
            file?: undefined;
            severity?: undefined;
            query?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
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
                description: string;
            };
            file: {
                type: string;
                description: string;
            };
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            line: {
                type: string;
                description: string;
            };
            character: {
                type: string;
                description: string;
            };
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            includeDeclaration?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            line: {
                type: string;
                description: string;
            };
            character: {
                type: string;
                description: string;
            };
            includeDeclaration: {
                type: string;
            };
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file?: undefined;
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            pattern?: undefined;
            language?: undefined;
            path?: undefined;
            maxResults?: undefined;
            context?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            pattern: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                enum: string[];
            };
            path: {
                type: string;
                description: string;
            };
            maxResults: {
                type: string;
            };
            context: {
                type: string;
            };
            file?: undefined;
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            pattern: {
                type: string;
                description: string;
            };
            replacement: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                enum: string[];
            };
            path: {
                type: string;
                description?: undefined;
            };
            dryRun: {
                type: string;
                description: string;
            };
            file?: undefined;
            severity?: undefined;
            directory?: undefined;
            strategy?: undefined;
            query?: undefined;
            line?: undefined;
            character?: undefined;
            includeDeclaration?: undefined;
            maxResults?: undefined;
            context?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleCodeIntelToolCall(request: {
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
export {};
//# sourceMappingURL=code-intel-server.d.ts.map