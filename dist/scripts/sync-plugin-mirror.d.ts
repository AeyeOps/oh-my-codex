#!/usr/bin/env node
export interface SyncPluginMirrorOptions {
    root?: string;
    check?: boolean;
    verbose?: boolean;
}
export interface SyncPluginMirrorResult {
    checked: boolean;
    mirroredSkillNames: string[];
    changed: boolean;
}
export declare function syncPluginMirror(options?: SyncPluginMirrorOptions): Promise<SyncPluginMirrorResult>;
//# sourceMappingURL=sync-plugin-mirror.d.ts.map