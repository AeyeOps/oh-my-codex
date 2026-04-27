import { type ApprovedExecutionLaunchHint } from '../planning/artifacts.js';
export declare const RALPH_HELP = "omx ralph - Launch Codex with ralph persistence mode active\n\nUsage:\n  omx ralph [task text...]\n  omx ralph --prd \"<task text>\"\n  omx ralph [ralph-options] [codex-args...] [task text...]\n\nOptions:\n  --help, -h           Show this help message\n  --prd <task text>    PRD mode shortcut: mark the task text explicitly\n  --prd=<task text>    Same as --prd \"<task text>\"\n  --no-deslop         Skip the final ai-slop-cleaner pass\n\nPRD mode:\n  Ralph initializes persistence artifacts in .omx/ so PRD and progress\n  state can survive across Codex sessions. Provide task text either as\n  positional words or with --prd.\n  Prompt-side `$ralph` activation is separate from this CLI entrypoint and\n  does not imply `--prd` or the PRD.json startup gate.\n\nCommon patterns:\n  omx ralph \"Fix flaky notify-hook tests\"\n  omx ralph --prd \"Ship release checklist automation\"\n  omx ralph --model gpt-5 \"Refactor state hydration\"\n  omx ralph -- --task-with-leading-dash\n";
export declare function isRalphPrdMode(args: readonly string[]): boolean;
export declare function assertRequiredRalphPrdJson(cwd: string, args: readonly string[]): void;
export declare function extractRalphTaskDescription(args: readonly string[], fallbackTask?: string): string;
export declare function normalizeRalphCliArgs(args: readonly string[]): string[];
export declare function filterRalphCodexArgs(args: readonly string[]): string[];
export declare function buildRalphChangedFilesSeedContents(): string;
export declare function buildRalphAppendInstructions(task: string, options: {
    changedFilesPath: string;
    noDeslop: boolean;
    approvedHint?: ApprovedExecutionLaunchHint | null;
}): string;
export declare function ralphCommand(args: string[]): Promise<void>;
//# sourceMappingURL=ralph.d.ts.map