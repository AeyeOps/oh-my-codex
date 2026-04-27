/**
 * OMX HUD - ANSI Color Utilities
 *
 * Terminal color codes for statusline rendering.
 * Ported from oh-my-claudecode.
 */
export declare const RESET = "\u001B[0m";
export declare function setColorEnabled(enabled: boolean): void;
export declare function isColorEnabled(): boolean;
export declare function green(text: string): string;
export declare function yellow(text: string): string;
export declare function cyan(text: string): string;
export declare function dim(text: string): string;
export declare function bold(text: string): string;
/**
 * Get color code based on ralph iteration progress.
 */
export declare function getRalphColor(iteration: number, maxIterations: number): string;
//# sourceMappingURL=colors.d.ts.map