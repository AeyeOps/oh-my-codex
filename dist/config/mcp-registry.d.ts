export interface UnifiedMcpRegistryServer {
    name: string;
    command: string;
    args: string[];
    enabled: boolean;
    startupTimeoutSec?: number;
    approval_mode?: string;
}
export interface UnifiedMcpRegistryLoadResult {
    servers: UnifiedMcpRegistryServer[];
    sourcePath?: string;
    warnings: string[];
}
export interface ClaudeCodeMcpServerConfig {
    command: string;
    args: string[];
    enabled: boolean;
    approval_mode?: string;
}
export interface ClaudeCodeSettingsSyncPlan {
    content?: string;
    added: string[];
    unchanged: string[];
    warnings: string[];
}
interface LoadUnifiedMcpRegistryOptions {
    candidates?: string[];
    homeDir?: string;
}
export declare function getUnifiedMcpRegistryCandidates(homeDir?: string): string[];
export declare function getLegacyUnifiedMcpRegistryCandidate(homeDir?: string): string;
export declare function loadUnifiedMcpRegistry(options?: LoadUnifiedMcpRegistryOptions): Promise<UnifiedMcpRegistryLoadResult>;
export declare function planClaudeCodeMcpSettingsSync(existingContent: string, servers: UnifiedMcpRegistryServer[]): ClaudeCodeSettingsSyncPlan;
export {};
//# sourceMappingURL=mcp-registry.d.ts.map