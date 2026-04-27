import { type SessionSearchOptions } from '../session-history/search.js';
export interface ParsedSessionSearchArgs {
    options: SessionSearchOptions;
    json: boolean;
}
export declare function parseSessionSearchArgs(args: string[]): ParsedSessionSearchArgs;
export declare function sessionCommand(args: string[]): Promise<void>;
//# sourceMappingURL=session-search.d.ts.map