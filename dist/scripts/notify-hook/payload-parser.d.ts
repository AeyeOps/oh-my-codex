/**
 * Payload field extraction for notify-hook.
 */
export declare const LANGUAGE_REMINDER_MARKER = "[OMX_LANG_REMINDER]";
export declare const LANGUAGE_REMINDER_TEXT = "[OMX_LANG_REMINDER] User input includes non-Latin script. Continue in the user's language.";
export declare function extractLimitPct(limit: any): number | null;
export declare function getSessionTokenUsage(payload: any): any;
export declare function getQuotaUsage(payload: any): any;
export declare function normalizeInputMessages(payload: any): string[];
export declare function renderPrompt(template: any, context: any): string;
export declare function hasNonLatinScript(text: any): boolean;
export declare function injectLanguageReminder(prompt: any, sourceText: any): string;
//# sourceMappingURL=payload-parser.d.ts.map