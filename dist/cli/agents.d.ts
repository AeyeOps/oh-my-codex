export declare const RESERVED_NATIVE_AGENT_NAMES: Set<string>;
type AgentScope = 'user' | 'project';
export interface NativeAgentInfo {
    scope: AgentScope;
    path: string;
    file: string;
    name: string;
    description: string;
    model?: string;
}
export declare function listNativeAgents(cwd?: string, scope?: AgentScope): Promise<NativeAgentInfo[]>;
export declare function agentsCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=agents.d.ts.map