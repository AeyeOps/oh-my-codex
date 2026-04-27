import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createHookPluginSdk } from '../sdk.js';
const _assertNoPluginStateAlias = false;
function makeEvent(event = 'session-start') {
    return {
        schema_version: '1',
        event,
        timestamp: '2026-01-01T00:00:00.000Z',
        source: 'native',
        context: {},
    };
}
describe('HookPluginSdk public surface', () => {
    it('does not expose a pluginState alias at runtime', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-sdk-surface-'));
        try {
            const sdk = createHookPluginSdk({ cwd, pluginName: 'test', event: makeEvent() });
            assert.equal('state' in sdk, true);
            assert.equal('pluginState' in sdk, false);
            assert.equal(Object.prototype.hasOwnProperty.call(sdk, 'pluginState'), false);
            assert.equal(Reflect.get(sdk, 'pluginState'), undefined);
        }
        finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=sdk-public-surface.test.js.map