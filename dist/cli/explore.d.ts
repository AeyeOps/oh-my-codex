export declare const EXPLORE_USAGE: string;
export declare const EXPLORE_BIN_ENV = "OMX_EXPLORE_BIN";
export interface ParsedExploreArgs {
    prompt?: string;
    promptFile?: string;
}
interface ExploreHarnessCommand {
    command: string;
    args: string[];
}
export declare function getBuiltinExploreHarnessUnsupportedReason(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): string | undefined;
export declare function assertBuiltinExploreHarnessSupported(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): void;
export interface ExploreSparkShellRoute {
    argv: string[];
    reason: 'shell-native' | 'long-output';
}
export declare function buildExplorePromptWithWikiContext(prompt: string, cwd: string): string;
export declare function resolveExploreSparkShellRoute(prompt: string): ExploreSparkShellRoute | undefined;
export declare function packagedExploreHarnessBinaryName(platform?: NodeJS.Platform): string;
export declare function resolvePackagedExploreHarnessCommand(packageRoot?: string, platform?: NodeJS.Platform, arch?: NodeJS.Architecture): ExploreHarnessCommand | undefined;
export declare function repoBuiltExploreHarnessCommand(packageRoot?: string, platform?: NodeJS.Platform): ExploreHarnessCommand | undefined;
export declare function parseExploreArgs(args: readonly string[]): ParsedExploreArgs;
export declare function resolveExploreHarnessCommand(packageRoot?: string, env?: NodeJS.ProcessEnv): ExploreHarnessCommand;
export declare function resolveExploreHarnessCommandWithHydration(packageRoot?: string, env?: NodeJS.ProcessEnv): Promise<ExploreHarnessCommand>;
export declare function buildExploreHarnessArgs(prompt: string, cwd: string, env?: NodeJS.ProcessEnv, packageRoot?: string): string[];
export declare function resolveExploreEnv(cwd: string, env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export declare function loadExplorePrompt(parsed: ParsedExploreArgs): Promise<string>;
export declare function exploreCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=explore.d.ts.map