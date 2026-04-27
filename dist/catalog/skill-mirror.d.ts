export interface DirectoryMirrorMismatch {
    kind: 'missing-directory' | 'file-list' | 'content' | 'not-directory';
    path?: string;
    expected?: string[];
    actual?: string[];
}
export interface DirectoryMirrorOptions {
    expectedContent?: (relativeFile: string, content: Buffer) => Buffer | Promise<Buffer>;
}
export interface SkillMirrorMismatch {
    kind: 'skill-list' | 'unexpected-entry' | 'skill-directory';
    skillName?: string;
    message: string;
    expected?: string[];
    actual?: string[];
}
export declare function compareDirectoryMirror(expectedDir: string, actualDir: string, options?: DirectoryMirrorOptions): Promise<DirectoryMirrorMismatch | null>;
export declare function compareSkillMirror(expectedSkillsDir: string, actualSkillsDir: string, expectedSkillNames: readonly string[], options?: DirectoryMirrorOptions): Promise<SkillMirrorMismatch | null>;
export declare function assertSkillMirror(expectedSkillsDir: string, actualSkillsDir: string, expectedSkillNames: readonly string[], options?: DirectoryMirrorOptions): Promise<void>;
//# sourceMappingURL=skill-mirror.d.ts.map