import { readFile } from 'fs/promises';
export function safeJsonParse(raw, fallback) {
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
export async function safeReadJsonFile(filePath, fallback) {
    try {
        const raw = await readFile(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=safe-json.js.map