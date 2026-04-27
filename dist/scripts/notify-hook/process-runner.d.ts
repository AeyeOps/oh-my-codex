/**
 * Subprocess helper for notify-hook modules.
 */
export declare function runProcess(command: string, args: string[], timeoutMs?: number): Promise<{
    stdout: string;
    stderr: string;
    code: number | null;
}>;
//# sourceMappingURL=process-runner.d.ts.map