import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertBuiltinExploreHarnessSupported, getBuiltinExploreHarnessUnsupportedReason, } from '../explore.js';
describe('explore Windows built-in harness diagnostics', () => {
    it('reports the built-in harness as unsupported on Windows unless a custom override is set', () => {
        assert.match(getBuiltinExploreHarnessUnsupportedReason('win32', {}) || '', /not ready on Windows/i);
        assert.equal(getBuiltinExploreHarnessUnsupportedReason('win32', { OMX_EXPLORE_BIN: 'custom-harness.exe' }), undefined);
        assert.equal(getBuiltinExploreHarnessUnsupportedReason('linux', {}), undefined);
    });
    it('fails early with actionable guidance for the built-in harness on Windows', () => {
        assert.throws(() => assertBuiltinExploreHarnessSupported('win32', {}), /built-in explore harness is not ready on Windows/i);
        assert.doesNotThrow(() => assertBuiltinExploreHarnessSupported('win32', {
            OMX_EXPLORE_BIN: 'custom-harness.exe',
        }));
    });
});
//# sourceMappingURL=explore-windows-diagnostics.test.js.map