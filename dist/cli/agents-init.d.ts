export declare const AGENTS_INIT_USAGE: string;
interface AgentsInitOptions {
    dryRun?: boolean;
    force?: boolean;
    verbose?: boolean;
    targetPath?: string;
}
export declare function applyProjectScopePathRewritesToAgentsTemplate(content: string): string;
export declare function renderManagedProjectRootAgents(existingContent?: string): Promise<string>;
export declare function renderManagedDirectoryAgents(dir: string, existingContent?: string, assumeParentAgents?: boolean): Promise<string>;
export declare function agentsInit(options?: AgentsInitOptions): Promise<void>;
export declare function agentsInitCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=agents-init.d.ts.map