/**
 * Tests for issue #215: tmux scrollback preservation during OMX output injection.
 *
 * When a pane is in copy-mode (scrollback), tmux's `pane_in_mode` format
 * variable returns "1".  Injecting send-keys into such a pane would kick the
 * user out of scrollback.  The fix checks pane_in_mode before sending and
 * skips with reason `scroll_active` when the pane is scrolling.
 */
export {};
//# sourceMappingURL=notify-hook-tmux-scrollback.test.d.ts.map