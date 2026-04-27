/**
 * Agent role definitions for oh-my-codex
 * Each agent has a name, description, default reasoning effort, and tool access pattern.
 * Prompt content is loaded from the prompts/ directory at runtime.
 */
export interface AgentDefinition {
    name: string;
    description: string;
    reasoningEffort: 'low' | 'medium' | 'high';
    posture: 'frontier-orchestrator' | 'deep-worker' | 'fast-lane';
    modelClass: 'frontier' | 'standard' | 'fast';
    routingRole: 'leader' | 'specialist' | 'executor';
    /** Tool access pattern */
    tools: 'read-only' | 'analysis' | 'execution' | 'data';
    /** Category for grouping */
    category: 'build' | 'review' | 'domain' | 'product' | 'coordination';
}
export declare const AGENT_DEFINITIONS: Record<string, AgentDefinition>;
/** Get agent definition by name */
export declare function getAgent(name: string): AgentDefinition | undefined;
/** Get all agents in a category */
export declare function getAgentsByCategory(category: AgentDefinition['category']): AgentDefinition[];
/** Get all agent names */
export declare function getAgentNames(): string[];
//# sourceMappingURL=definitions.d.ts.map