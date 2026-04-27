import { execFileSync } from 'node:child_process';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
export type McpServerName = 'state' | 'memory' | 'code_intel' | 'trace' | 'wiki';
export declare const MCP_ENTRYPOINT_MARKER_ENV = "OMX_MCP_ENTRYPOINT_MARKER";
interface StdioLifecycleServer {
    connect(transport: StdioServerTransport): Promise<unknown>;
    close(): Promise<unknown>;
}
export interface ProcessTableEntry {
    pid: number;
    ppid: number;
    command: string;
}
export interface DuplicateSiblingObservation {
    status: 'ambiguous' | 'unique' | 'newest' | 'older_duplicate';
    entrypoint: string | null;
    matchingPids: number[];
    newerSiblingPids: number[];
}
export declare function extractMcpEntrypointMarker(command: string): string | null;
export declare function resolveCurrentMcpEntrypointMarker(env?: Record<string, string | undefined>, argv1?: string | undefined): string | null;
export declare function parseProcessTable(output: string): ProcessTableEntry[];
export declare function listProcessTable(readPs?: typeof execFileSync): ProcessTableEntry[] | null;
export declare function analyzeDuplicateSiblingState(processes: readonly ProcessTableEntry[], currentPid: number, currentParentPid: number, currentEntrypoint: string | null): DuplicateSiblingObservation;
export declare function shouldSelfExitForDuplicateSibling(observation: DuplicateSiblingObservation, nowMs: number, duplicateObservedAtMs: number | null, lastTrafficAtMs: number | null, preTrafficGraceMs?: number, postTrafficIdleMs?: number): boolean;
export declare function isParentProcessAlive(parentPid: number, signalProcess?: typeof process.kill): boolean;
export declare function shouldAutoStartMcpServer(server: McpServerName, env?: Record<string, string | undefined>): boolean;
export declare function autoStartStdioMcpServer(serverName: McpServerName, server: StdioLifecycleServer, env?: Record<string, string | undefined>): void;
export {};
//# sourceMappingURL=bootstrap.d.ts.map