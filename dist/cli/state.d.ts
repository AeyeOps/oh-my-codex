import { executeStateOperation } from '../state/operations.js';
export interface StateCommandDependencies {
    stdout?: (line: string) => void;
    stderr?: (line: string) => void;
    execute?: typeof executeStateOperation;
}
export declare function stateCommand(args: string[], deps?: StateCommandDependencies): Promise<void>;
//# sourceMappingURL=state.d.ts.map