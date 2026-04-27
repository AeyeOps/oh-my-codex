import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, stat } from 'fs/promises';
import { basename, join } from 'path';
export const HOOK_PLUGIN_ENABLE_ENV = 'OMX_HOOK_PLUGINS';
export const HOOK_PLUGIN_TIMEOUT_ENV = 'OMX_HOOK_PLUGIN_TIMEOUT_MS';
function sanitizePluginId(fileName) {
    const stem = basename(fileName, '.mjs');
    const normalized = stem
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || 'plugin';
}
function shortFileHash(fileName) {
    return createHash('sha256').update(fileName).digest('hex').slice(0, 8);
}
function readTimeout(raw, fallback) {
    if (!raw)
        return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed))
        return fallback;
    const rounded = Math.floor(parsed);
    if (rounded < 100)
        return 100;
    if (rounded > 60_000)
        return 60_000;
    return rounded;
}
export function hooksDir(cwd) {
    return join(cwd, '.omx', 'hooks');
}
export function isHookPluginsEnabled(env = process.env) {
    const raw = `${env[HOOK_PLUGIN_ENABLE_ENV] ?? ''}`.trim().toLowerCase();
    // Plugins are ON by default — only disable if explicitly opted out
    if (raw === '0' || raw === 'false' || raw === 'no')
        return false;
    return true;
}
export function resolveHookPluginTimeoutMs(env = process.env, fallback = 1500) {
    return readTimeout(env[HOOK_PLUGIN_TIMEOUT_ENV], fallback);
}
export async function ensureHooksDir(cwd) {
    const dir = hooksDir(cwd);
    await mkdir(dir, { recursive: true });
    return dir;
}
const ON_HOOK_EVENT_EXPORT_PATTERN = /(?:^|\n)\s*export\s+(?:async\s+)?function\s+onHookEvent\b|(?:^|\n)\s*export\s+(?:const|let|var)\s+onHookEvent\b|(?:^|\n)\s*export\s*\{[^}]*\bonHookEvent\b[^}]*\}/m;
async function validatePluginExport(pluginPath) {
    try {
        const source = await readFile(pluginPath, 'utf-8');
        if (!ON_HOOK_EVENT_EXPORT_PATTERN.test(source)) {
            return { valid: false, reason: 'missing_onHookEvent_export' };
        }
        return { valid: true };
    }
    catch (err) {
        return {
            valid: false,
            reason: err instanceof Error ? err.message : 'failed_to_import_plugin',
        };
    }
}
export async function validateHookPluginExport(pluginPath) {
    return validatePluginExport(pluginPath);
}
export async function discoverHookPlugins(cwd) {
    const dir = hooksDir(cwd);
    if (!existsSync(dir))
        return [];
    const names = await readdir(dir).catch(() => []);
    const discovered = [];
    for (const name of names) {
        if (!name.endsWith('.mjs'))
            continue;
        const path = join(dir, name);
        const st = await stat(path).catch(() => null);
        if (!st || !st.isFile())
            continue;
        discovered.push({ idBase: sanitizePluginId(name), file: name, path });
    }
    const idCounts = new Map();
    for (const plugin of discovered) {
        idCounts.set(plugin.idBase, (idCounts.get(plugin.idBase) ?? 0) + 1);
    }
    const plugins = discovered.map((plugin) => {
        const hasCollision = (idCounts.get(plugin.idBase) ?? 0) > 1;
        const id = hasCollision ? `${plugin.idBase}-${shortFileHash(plugin.file)}` : plugin.idBase;
        return {
            id,
            name: id,
            file: plugin.file,
            path: plugin.path,
            filePath: plugin.path,
            fileName: plugin.file,
            valid: true,
        };
    });
    plugins.sort((a, b) => a.file.localeCompare(b.file));
    return plugins;
}
export async function loadHookPluginDescriptors(cwd) {
    const discovered = await discoverHookPlugins(cwd);
    const validated = [];
    for (const plugin of discovered) {
        const validation = await validatePluginExport(plugin.path);
        validated.push({
            ...plugin,
            valid: validation.valid,
            reason: validation.reason,
        });
    }
    return validated;
}
//# sourceMappingURL=loader.js.map