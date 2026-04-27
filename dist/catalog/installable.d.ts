import type { CatalogManifest, CatalogEntryStatus } from './schema.js';
export declare const SETUP_ONLY_INSTALLABLE_SKILLS: Set<string>;
export declare function isCatalogInstallableStatus(status: CatalogEntryStatus | string | undefined): boolean;
export declare function getSetupInstallableSkillNames(manifest: CatalogManifest | null | undefined): Set<string>;
//# sourceMappingURL=installable.d.ts.map