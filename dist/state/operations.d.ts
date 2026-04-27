export declare const SUPPORTED_STATE_READ_MODES: readonly ["autopilot", "autoresearch", "team", "ralph", "ultrawork", "ultraqa", "ralplan", "deep-interview"];
export type SupportedStateReadMode = (typeof SUPPORTED_STATE_READ_MODES)[number];
export type StateOperationName = 'state_read' | 'state_write' | 'state_clear' | 'state_list_active' | 'state_get_status';
export interface StateOperationResponse {
    payload: unknown;
    isError?: boolean;
}
export declare function listStateStatuses(cwd: string, explicitSessionId?: string, mode?: string): Promise<Record<string, unknown>>;
export declare function listActiveStateModes(workingDirectory?: string, explicitSessionId?: string): Promise<string[]>;
export declare function executeStateOperation(name: StateOperationName, rawArgs?: Record<string, unknown>): Promise<StateOperationResponse>;
//# sourceMappingURL=operations.d.ts.map