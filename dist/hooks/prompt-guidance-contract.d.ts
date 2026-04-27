export interface GuidanceSurfaceContract {
    id: string;
    path: string;
    requiredPatterns: RegExp[];
}
export declare const ROOT_TEMPLATE_CONTRACTS: GuidanceSurfaceContract[];
export declare const CORE_ROLE_CONTRACTS: GuidanceSurfaceContract[];
export declare const SCENARIO_ROLE_CONTRACTS: GuidanceSurfaceContract[];
export declare const WAVE_TWO_CONTRACTS: GuidanceSurfaceContract[];
export declare const CATALOG_CONTRACTS: GuidanceSurfaceContract[];
export declare const LEGACY_PROMPT_CONTRACTS: GuidanceSurfaceContract[];
export declare const SPECIALIZED_PROMPT_CONTRACTS: GuidanceSurfaceContract[];
export declare const SKILL_CONTRACTS: GuidanceSurfaceContract[];
export declare const PROMPT_REFACTOR_MARKER_CONTRACTS: {
    id: string;
    markers: string[];
    requiredPaths: string[];
}[];
export declare const PROMPT_REFACTOR_INVARIANT_CONTRACTS: GuidanceSurfaceContract[];
//# sourceMappingURL=prompt-guidance-contract.d.ts.map