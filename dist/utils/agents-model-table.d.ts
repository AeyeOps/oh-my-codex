import { type AgentDefinition } from '../agents/definitions.js';
export declare const OMX_MODELS_START_MARKER = "<!-- OMX:MODELS:START -->";
export declare const OMX_MODELS_END_MARKER = "<!-- OMX:MODELS:END -->";
export interface AgentsModelTableContext {
    frontierModel: string;
    sparkModel: string;
    subagentDefaultModel: string;
}
export declare function resolveAgentsModelTableContext(configTomlContent: string, options?: {
    codexHomeOverride?: string;
    env?: NodeJS.ProcessEnv;
}): AgentsModelTableContext;
export declare function buildAgentsModelTable(context: AgentsModelTableContext, definitions?: Record<string, AgentDefinition>): string;
export declare function renderAgentsModelTableBlock(context: AgentsModelTableContext, definitions?: Record<string, AgentDefinition>): string;
export declare function upsertAgentsModelTable(content: string, context: AgentsModelTableContext, definitions?: Record<string, AgentDefinition>): string;
//# sourceMappingURL=agents-model-table.d.ts.map