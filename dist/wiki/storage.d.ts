/**
 * Wiki Storage
 *
 * File I/O layer for the OMX wiki knowledge base.
 */
import { type WikiLogEntry, type WikiPage, type WikiPageFrontmatter } from './types.js';
export declare function getWikiDir(root: string): string;
export declare function ensureWikiDir(root: string): string;
export declare function withWikiLock<T>(root: string, fn: () => T): T;
export declare function parseFrontmatter(raw: string): {
    frontmatter: WikiPageFrontmatter;
    content: string;
} | null;
export declare function serializePage(page: WikiPage): string;
export declare function readPage(root: string, filename: string): WikiPage | null;
export declare function listPages(root: string): string[];
export declare function readAllPages(root: string): WikiPage[];
export declare function readIndex(root: string): string | null;
export declare function readLog(root: string): string | null;
export declare function writePageUnsafe(root: string, page: WikiPage, options?: {
    allowReserved?: boolean;
}): void;
export declare function deletePageUnsafe(root: string, filename: string): boolean;
export declare function updateIndexUnsafe(root: string): void;
export declare function appendLogUnsafe(root: string, entry: WikiLogEntry): void;
export declare function writePage(root: string, page: WikiPage, options?: {
    allowReserved?: boolean;
}): void;
export declare function deletePage(root: string, filename: string): boolean;
export declare function appendLog(root: string, entry: WikiLogEntry): void;
export declare function titleToSlug(title: string): string;
export declare function normalizeWikiPageName(page: string): string;
//# sourceMappingURL=storage.d.ts.map