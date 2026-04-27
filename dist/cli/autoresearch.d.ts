import { parseInitArgs } from './autoresearch-guided.js';
export declare const AUTORESEARCH_DEPRECATION_MESSAGE: string;
export declare const AUTORESEARCH_HELP = "omx autoresearch - Hard-deprecated legacy command surface\n\nUsage:\n  omx autoresearch --help\n\nDeprecated legacy forms (all fail intentionally):\n  omx autoresearch\n  omx autoresearch [--topic T] [--evaluator CMD] [--keep-policy P] [--slug S]\n  omx autoresearch init [--topic T] [--evaluator CMD] [--keep-policy P] [--slug S]\n  omx autoresearch run <mission-dir> [codex-args...]\n  omx autoresearch <mission-dir> [codex-args...]\n  omx autoresearch --resume <run-id> [codex-args...]\n\nMigration:\n  - Use `$deep-interview --autoresearch` to clarify the mission and write canonical artifacts under `.omx/specs/autoresearch-{slug}/`\n  - Use `$autoresearch \"your mission\"` for the stateful validator-gated execution loop\n  - Choose validation mode at init:\n      1. mission-validator-script\n      2. prompt-architect-artifact\n  - Completion now depends on validator evidence, not repeated no-ops or detached tmux launch parity\n";
export interface ParsedAutoresearchArgs {
    missionDir: string | null;
    runId: string | null;
    codexArgs: string[];
    guided?: boolean;
    initArgs?: string[];
    seedArgs?: ReturnType<typeof parseInitArgs>;
    runSubcommand?: boolean;
}
export declare function normalizeAutoresearchCodexArgs(codexArgs: readonly string[]): string[];
export declare function parseAutoresearchArgs(args: readonly string[]): ParsedAutoresearchArgs;
export declare function autoresearchCommand(args: string[]): Promise<void>;
//# sourceMappingURL=autoresearch.d.ts.map