/**
 * omx uninstall - Remove oh-my-codex configuration and installed artifacts
 */
import { type SetupScope } from "./setup.js";
export interface UninstallOptions {
    dryRun?: boolean;
    keepConfig?: boolean;
    verbose?: boolean;
    purge?: boolean;
    scope?: SetupScope;
}
export declare function uninstall(options?: UninstallOptions): Promise<void>;
//# sourceMappingURL=uninstall.d.ts.map