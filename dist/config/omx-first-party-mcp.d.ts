import type { UnifiedMcpRegistryServer } from "./mcp-registry.js";
export declare const OMX_PLUGIN_MCP_COMMAND = "omx";
export declare const OMX_PLUGIN_MCP_SERVE_SUBCOMMAND = "mcp-serve";
export declare const OMX_FIRST_PARTY_MCP_SERVER_NAMES: string[];
export declare const OMX_FIRST_PARTY_MCP_ENTRYPOINTS: string[];
export declare const OMX_FIRST_PARTY_MCP_PLUGIN_TARGETS: string[];
export declare function resolveOmxFirstPartyMcpEntrypointForPluginTarget(target: string | undefined): string | null;
export declare function getOmxFirstPartySetupMcpServers(pkgRoot: string): Array<UnifiedMcpRegistryServer & {
    title: string;
}>;
export declare function buildOmxPluginMcpManifest(): {
    mcpServers: Record<string, {
        command: string;
        args: string[];
        enabled: boolean;
    }>;
};
//# sourceMappingURL=omx-first-party-mcp.d.ts.map