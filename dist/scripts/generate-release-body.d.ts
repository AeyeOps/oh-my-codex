#!/usr/bin/env node
export interface Contributor {
    displayName: string;
    login?: string;
    url?: string;
}
interface GenerateReleaseBodyOptions {
    templatePath: string;
    outPath: string;
    currentTag?: string;
    previousTag?: string;
    repo?: string;
    githubToken?: string;
    cwd?: string;
}
export declare function resolveCurrentTag(cwd: string, explicit?: string): string;
export declare function resolvePreviousTag(cwd: string, currentTag: string, explicit?: string): string | undefined;
export declare function verifyCompareRange(cwd: string, currentTag: string, previousTag?: string): void;
export declare function formatContributor(contributor: Contributor): string;
export declare function renderContributorsSection(contributors: Contributor[]): string;
export declare function buildFullChangelogLine(repo: string, currentTag: string, previousTag?: string): string;
export declare function replaceSectionBody(markdown: string, heading: string, body: string): string;
export declare function replaceFullChangelogLine(markdown: string, fullChangelogLine: string): string;
export declare function getGitContributors(cwd: string, currentTag: string, previousTag?: string): Contributor[];
export declare function getGitHubCompareContributors(repo: string, currentTag: string, previousTag: string, githubToken: string, fetchImpl?: typeof fetch): Promise<Contributor[]>;
export declare function resolveContributors(options: {
    cwd: string;
    repo?: string;
    currentTag: string;
    previousTag?: string;
    githubToken?: string;
}): Promise<Contributor[]>;
export declare function generateReleaseBody(options: GenerateReleaseBodyOptions): Promise<string>;
export {};
//# sourceMappingURL=generate-release-body.d.ts.map