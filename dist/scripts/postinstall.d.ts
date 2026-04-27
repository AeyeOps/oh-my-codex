import { type UserInstallStamp } from "../cli/update.js";
type PostinstallStatus = "noop-local" | "noop-same-version" | "noop-missing-version" | "hinted";
export interface PostinstallResult {
    status: PostinstallStatus;
    version: string | null;
}
interface PostinstallDependencies {
    env: NodeJS.ProcessEnv;
    getCurrentVersion: () => Promise<string | null>;
    log: (message: string) => void;
    readStamp: () => Promise<UserInstallStamp | null>;
    writeStamp: (stamp: UserInstallStamp) => Promise<void>;
}
export declare function isGlobalInstallLifecycle(env?: NodeJS.ProcessEnv): boolean;
export declare function runPostinstall(dependencies?: Partial<PostinstallDependencies>): Promise<PostinstallResult>;
export declare function main(): Promise<void>;
export {};
//# sourceMappingURL=postinstall.d.ts.map