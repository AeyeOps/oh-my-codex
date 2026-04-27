import { type SetupInstallMode, type SetupScope } from "./setup.js";
export declare function readPersistedSetupScope(cwd: string): SetupScope | undefined;
export declare function readPersistedSetupPreferences(cwd: string): Partial<{
    scope: SetupScope;
    installMode: SetupInstallMode;
}> | undefined;
export declare function resolveCodexHomeForLaunch(cwd: string, env?: NodeJS.ProcessEnv): string | undefined;
export declare function resolveCodexConfigPathForLaunch(cwd: string, env?: NodeJS.ProcessEnv): string;
//# sourceMappingURL=codex-home.d.ts.map