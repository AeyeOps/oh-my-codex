declare const ARRAY_CONTAINING: unique symbol;
type ArrayContaining = {
    __matcher: typeof ARRAY_CONTAINING;
    expected: unknown[];
};
export declare function expect(actual: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toContain(expected: unknown): void;
    toBeNull(): void;
    toHaveLength(expected: number): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toHaveProperty(property: string): void;
    toMatch(pattern: RegExp): void;
    toThrow(expected?: string | RegExp): void;
    readonly not: {
        toBeNull(): void;
        toBe(expected: unknown): void;
        toContain(expected: unknown): void;
        toThrow(): void;
    };
};
export declare namespace expect {
    var arrayContaining: (expected: unknown[]) => ArrayContaining;
}
export {};
//# sourceMappingURL=test-helpers.d.ts.map