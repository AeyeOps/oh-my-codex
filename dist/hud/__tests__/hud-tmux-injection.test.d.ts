/**
 * Tests for shell command injection hardening in the tmux HUD launcher.
 *
 * The first describe block reproduces the vulnerability that existed when
 * launchTmuxPane() built a command string via template-literal interpolation
 * and passed it to execSync().  The second block verifies the hardened
 * buildTmuxSplitArgs() + shellEscape() approach is safe.
 */
export {};
//# sourceMappingURL=hud-tmux-injection.test.d.ts.map