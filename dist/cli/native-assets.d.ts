export type NativeProduct = 'omx-explore-harness' | 'omx-sparkshell';
export type NativeLibc = 'musl' | 'glibc';
export interface NativeReleaseAsset {
    product: NativeProduct;
    version: string;
    platform: NodeJS.Platform;
    arch: string;
    target?: string;
    libc?: NativeLibc;
    archive: string;
    binary: string;
    binary_path: string;
    sha256: string;
    size?: number;
    download_url: string;
}
export interface NativeReleaseManifest {
    manifest_version?: number;
    version: string;
    tag?: string;
    generated_at?: string;
    assets: NativeReleaseAsset[];
}
export interface HydrateNativeBinaryOptions {
    packageRoot?: string;
    env?: NodeJS.ProcessEnv;
    platform?: NodeJS.Platform;
    arch?: string;
}
export interface NativeBinaryCandidateOptions {
    linuxLibcPreference?: readonly NativeLibc[];
}
export interface ResolveLinuxNativeLibcPreferenceOptions {
    env?: NodeJS.ProcessEnv;
    detectedRuntime?: NativeLibc;
}
export declare const EXPLORE_BIN_ENV = "OMX_EXPLORE_BIN";
export declare const SPARKSHELL_BIN_ENV = "OMX_SPARKSHELL_BIN";
export declare function getPackageVersion(packageRoot?: string): Promise<string>;
export declare function resolveNativeReleaseBaseUrl(packageRoot?: string, version?: string, env?: NodeJS.ProcessEnv): Promise<string>;
export declare function resolveNativeManifestUrl(packageRoot?: string, version?: string, env?: NodeJS.ProcessEnv): Promise<string>;
export declare function resolveNativeCacheRoot(env?: NodeJS.ProcessEnv): string;
export declare function resolveCachedNativeBinaryPath(product: NativeProduct, version: string, platform?: NodeJS.Platform, arch?: string, env?: NodeJS.ProcessEnv, libc?: NativeLibc): string;
export declare function resolveLinuxNativeLibcPreference(options?: ResolveLinuxNativeLibcPreferenceOptions): NativeLibc[];
export declare function inferNativeAssetLibc(asset: Pick<NativeReleaseAsset, 'archive' | 'target' | 'libc'>): NativeLibc | undefined;
export declare function resolveCachedNativeBinaryCandidatePaths(product: NativeProduct, version: string, platform?: NodeJS.Platform, arch?: string, env?: NodeJS.ProcessEnv, options?: NativeBinaryCandidateOptions): string[];
export declare function resolveNativeReleaseAssetCandidates(manifest: NativeReleaseManifest, product: NativeProduct, version: string, platform: NodeJS.Platform, arch: string, options?: NativeBinaryCandidateOptions): NativeReleaseAsset[];
export declare function isRepositoryCheckout(packageRoot?: string): boolean;
export declare function loadNativeReleaseManifest(packageRoot?: string, version?: string, env?: NodeJS.ProcessEnv): Promise<NativeReleaseManifest>;
export declare function hydrateNativeBinary(product: NativeProduct, options?: HydrateNativeBinaryOptions): Promise<string | undefined>;
//# sourceMappingURL=native-assets.d.ts.map