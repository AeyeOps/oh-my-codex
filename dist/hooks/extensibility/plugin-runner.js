import { basename } from 'path';
import { pathToFileURL } from 'url';
import { createHookPluginSdk } from './sdk.js';
const RESULT_PREFIX = '__OMX_PLUGIN_RESULT__ ';
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks).toString('utf-8').trim();
}
function emitResult(result) {
    process.stdout.write(`${RESULT_PREFIX}${JSON.stringify(result)}\n`);
}
async function main() {
    const raw = await readStdin();
    if (!raw) {
        emitResult({ ok: false, plugin: 'unknown', reason: 'empty_request' });
        process.exit(1);
        return;
    }
    let request;
    try {
        request = JSON.parse(raw);
    }
    catch {
        emitResult({ ok: false, plugin: 'unknown', reason: 'invalid_json' });
        process.exit(1);
        return;
    }
    const pluginId = (request.pluginId || basename(request.pluginPath || 'unknown')).trim() || 'unknown';
    try {
        const moduleUrl = `${pathToFileURL(request.pluginPath).href}?t=${Date.now()}`;
        const loaded = await import(moduleUrl);
        if (typeof loaded.onHookEvent !== 'function') {
            emitResult({ ok: false, plugin: pluginId, reason: 'invalid_export' });
            process.exit(1);
            return;
        }
        const sdk = createHookPluginSdk({
            cwd: request.cwd,
            pluginName: pluginId,
            event: request.event,
            sideEffectsEnabled: request.sideEffectsEnabled !== false,
        });
        await Promise.resolve(loaded.onHookEvent(request.event, sdk));
        emitResult({ ok: true, plugin: pluginId, reason: 'ok' });
        process.exit(0);
    }
    catch (error) {
        emitResult({
            ok: false,
            plugin: pluginId,
            reason: 'runner_error',
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
}
main().catch((error) => {
    emitResult({
        ok: false,
        plugin: 'unknown',
        reason: 'runner_error',
        error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
});
//# sourceMappingURL=plugin-runner.js.map