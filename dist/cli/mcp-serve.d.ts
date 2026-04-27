import { OMX_FIRST_PARTY_MCP_ENTRYPOINTS } from "../config/omx-first-party-mcp.js";
type McpServeEntrypoint = (typeof OMX_FIRST_PARTY_MCP_ENTRYPOINTS)[number];
type McpServeLoader = () => Promise<unknown>;
type McpServeLoaderMap = Record<McpServeEntrypoint, McpServeLoader>;
interface McpServeCommandOptions {
    env?: Record<string, string | undefined>;
    loaders?: McpServeLoaderMap;
}
export declare function normalizeOmxMcpServeTarget(rawTarget: string | undefined): McpServeEntrypoint | null;
export declare function mcpServeCommand(args: string[], options?: McpServeCommandOptions): Promise<void>;
export {};
//# sourceMappingURL=mcp-serve.d.ts.map