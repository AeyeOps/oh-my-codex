export declare const OMX_NOTIFY_TEMP_ENV = "OMX_NOTIFY_TEMP";
export declare const OMX_NOTIFY_TEMP_CONTRACT_ENV = "OMX_NOTIFY_TEMP_CONTRACT";
export type NotifyTempSource = 'none' | 'cli' | 'env' | 'providers';
export interface NotifyTempContract {
    active: boolean;
    selectors: string[];
    canonicalSelectors: string[];
    warnings: string[];
    source: NotifyTempSource;
}
export interface ParseNotifyTempContractResult {
    contract: NotifyTempContract;
    passthroughArgs: string[];
}
export declare function parseNotifyTempContractFromArgs(args: string[], env?: NodeJS.ProcessEnv): ParseNotifyTempContractResult;
export declare function serializeNotifyTempContract(contract: NotifyTempContract): string;
export declare function isNotifyTempEnvActive(env?: NodeJS.ProcessEnv): boolean;
export declare function readNotifyTempContractFromEnv(env?: NodeJS.ProcessEnv): NotifyTempContract | null;
export declare function isOpenClawSelectedInTempContract(contract: NotifyTempContract | null): boolean;
export declare function getTempBuiltinSelectors(contract: NotifyTempContract | null): Set<string>;
export declare function getSelectedOpenClawGatewayNames(contract: NotifyTempContract | null): Set<string>;
//# sourceMappingURL=temp-contract.d.ts.map