import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withModeRuntimeContext } from '../mode-state-context.js';
describe('withModeRuntimeContext', () => {
    it('captures tmux_pane_id on activation when env has TMUX_PANE', () => {
        const existing = { active: false };
        const next = { active: true };
        const out = withModeRuntimeContext(existing, next, {
            env: { TMUX_PANE: '%7' },
            nowIso: '2026-02-13T00:00:00.000Z',
        });
        assert.equal(out.tmux_pane_id, '%7');
        assert.equal(out.tmux_pane_set_at, '2026-02-13T00:00:00.000Z');
    });
    it('does not overwrite tmux_pane_id once set', () => {
        const existing = { active: true, tmux_pane_id: '%1', tmux_pane_set_at: 'x' };
        const next = { active: true, tmux_pane_id: '%1', tmux_pane_set_at: 'x' };
        const out = withModeRuntimeContext(existing, next, {
            env: { TMUX_PANE: '%9' },
            nowIso: '2026-02-13T00:00:00.000Z',
        });
        assert.equal(out.tmux_pane_id, '%1');
        assert.equal(out.tmux_pane_set_at, 'x');
    });
    it('does nothing when TMUX_PANE is missing', () => {
        const existing = { active: false };
        const next = { active: true };
        const out = withModeRuntimeContext(existing, next, {
            env: {},
            nowIso: '2026-02-13T00:00:00.000Z',
        });
        assert.equal(out.tmux_pane_id, undefined);
    });
});
//# sourceMappingURL=mode-state-context.test.js.map