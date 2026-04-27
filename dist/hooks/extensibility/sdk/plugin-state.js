import { existsSync } from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { hookPluginDataPath, hookPluginRootDir, sanitizeHookPluginName } from './paths.js';
async function readJsonIfExists(path, fallback) {
    if (!existsSync(path))
        return fallback;
    try {
        return JSON.parse(await readFile(path, 'utf-8'));
    }
    catch {
        return fallback;
    }
}
export function normalizeHookPluginStateKey(key) {
    const trimmed = key.trim();
    if (!trimmed)
        throw new Error('state key is required');
    if (trimmed.includes('..') || trimmed.startsWith('/')) {
        throw new Error('invalid state key');
    }
    return trimmed;
}
export function createHookPluginStateApi(cwd, pluginName) {
    const dataPath = hookPluginDataPath(cwd, pluginName);
    async function readData() {
        return readJsonIfExists(dataPath, {});
    }
    async function writeData(value) {
        await mkdir(dirname(dataPath), { recursive: true });
        await writeFile(dataPath, JSON.stringify(value, null, 2));
    }
    return {
        read: async (key, fallback) => {
            const safeKey = normalizeHookPluginStateKey(key);
            const data = await readData();
            if (!(safeKey in data))
                return fallback;
            return data[safeKey];
        },
        write: async (key, value) => {
            const safeKey = normalizeHookPluginStateKey(key);
            const data = await readData();
            data[safeKey] = value;
            await writeData(data);
        },
        delete: async (key) => {
            const safeKey = normalizeHookPluginStateKey(key);
            const data = await readData();
            if (safeKey in data) {
                delete data[safeKey];
                await writeData(data);
            }
        },
        all: async () => {
            const data = await readData();
            return data;
        },
    };
}
export async function clearHookPluginStateFiles(cwd, pluginName) {
    const root = hookPluginRootDir(cwd, sanitizeHookPluginName(pluginName));
    await unlink(join(root, 'data.json')).catch(() => { });
    await unlink(join(root, 'tmux.json')).catch(() => { });
}
//# sourceMappingURL=plugin-state.js.map