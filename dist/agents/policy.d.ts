import type { CatalogAgentEntry, CatalogEntryStatus, CatalogManifest } from "../catalog/schema.js";
export declare const NON_NATIVE_AGENT_PROMPT_ASSETS: Set<string>;
export declare function isNativeAgentInstallableStatus(status: CatalogEntryStatus | string | undefined): boolean;
export declare function getCatalogAgentStatusByName(manifest: Pick<CatalogManifest, "agents">): Map<string, CatalogEntryStatus>;
export declare function getCatalogAgentByName(manifest: Pick<CatalogManifest, "agents">): Map<string, CatalogAgentEntry>;
export declare function getInstallableNativeAgentNames(manifest: Pick<CatalogManifest, "agents">): Set<string>;
export declare function getNonInstallableNativeAgentNames(manifest: Pick<CatalogManifest, "agents">): Set<string>;
export declare function isSetupPromptAssetName(promptName: string, manifest: Pick<CatalogManifest, "agents">): boolean;
export declare function assertNativeAgentCanonicalTargets(manifest: Pick<CatalogManifest, "agents">): void;
//# sourceMappingURL=policy.d.ts.map