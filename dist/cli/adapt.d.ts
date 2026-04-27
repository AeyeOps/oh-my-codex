export interface AdaptCommandDependencies {
    cwd?: string;
    stdout?: (line: string) => void;
}
export declare function adaptCommand(args: string[], deps?: AdaptCommandDependencies): Promise<void>;
//# sourceMappingURL=adapt.d.ts.map