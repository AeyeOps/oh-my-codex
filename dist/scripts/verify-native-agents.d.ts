#!/usr/bin/env node
import { type AgentDefinition } from "../agents/definitions.js";
import type { CatalogManifest } from "../catalog/schema.js";
export interface VerifyNativeAgentsOptions {
    root?: string;
    manifest?: CatalogManifest;
    definitions?: Record<string, AgentDefinition>;
    promptNames?: Set<string>;
    pluginManifest?: Record<string, unknown>;
}
export interface VerifyNativeAgentsResult {
    installableAgentNames: string[];
    promptAssetNames: string[];
}
export declare function verifyNativeAgents(options?: VerifyNativeAgentsOptions): Promise<VerifyNativeAgentsResult>;
//# sourceMappingURL=verify-native-agents.d.ts.map