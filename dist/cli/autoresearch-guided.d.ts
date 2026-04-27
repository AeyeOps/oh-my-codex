import { type AutoresearchKeepPolicy } from "../autoresearch/contracts.js";
import { type OmxQuestionSuccessPayload } from "../question/client.js";
import type { QuestionType } from "../question/types.js";
import { type AutoresearchDeepInterviewResult, type AutoresearchSeedInputs } from "./autoresearch-intake.js";
export interface InitAutoresearchOptions {
    topic: string;
    evaluatorCommand: string;
    keepPolicy: AutoresearchKeepPolicy;
    slug: string;
    repoRoot: string;
}
export interface InitAutoresearchResult {
    slug: string;
    artifactDir: string;
    missionArtifactPath: string;
    sandboxArtifactPath: string;
    resultPath: string;
}
export interface AutoresearchQuestionIO {
    question(prompt: string): Promise<string>;
    close(): void;
}
export interface AutoresearchStructuredQuestionInput {
    header?: string;
    question: string;
    options: Array<{
        label: string;
        value: string;
        description?: string;
    }>;
    allow_other: boolean;
    other_label?: string;
    multi_select?: boolean;
    type?: QuestionType;
    source?: string;
}
export type AutoresearchStructuredQuestionAsker = (input: AutoresearchStructuredQuestionInput) => Promise<OmxQuestionSuccessPayload>;
export declare function buildAutoresearchDeepInterviewPrompt(seedInputs?: AutoresearchSeedInputs): string;
export declare function materializeAutoresearchDeepInterviewResult(result: AutoresearchDeepInterviewResult): Promise<InitAutoresearchResult>;
export declare function parseInitArgs(args: readonly string[]): Partial<InitAutoresearchOptions>;
export declare function runAutoresearchNoviceBridge(repoRoot: string, seedInputs?: AutoresearchSeedInputs, io?: AutoresearchQuestionIO, structuredQuestion?: AutoresearchStructuredQuestionAsker): Promise<InitAutoresearchResult>;
export declare function guidedAutoresearchSetup(repoRoot: string): Promise<InitAutoresearchResult>;
//# sourceMappingURL=autoresearch-guided.d.ts.map