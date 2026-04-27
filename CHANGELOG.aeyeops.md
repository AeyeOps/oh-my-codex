# AeyeOps fork changelog

All notable AeyeOps-fork divergences from upstream [`Yeachan-Heo/oh-my-codex`](https://github.com/Yeachan-Heo/oh-my-codex) are documented in this file. The upstream [`CHANGELOG.md`](./CHANGELOG.md) is preserved unmodified so future upstream syncs merge cleanly.

## [Unreleased]

## 2026-04-27 — Install path overhaul

Major fork-only work to make the install path cleanly single-command on any consumer machine, regardless of npm version, `NODE_ENV`, `~/.npmrc`, or system `PATH` state. Resolves a long chain of npm-internal limitations exposed by `npm install -g <git-url>` (see [npm/cli #8440](https://github.com/npm/cli/issues/8440)), including dangling symlinks to deleted temp clones, prepare-time builds that couldn't find `tsc`, and post-install crashes on missing `process.cwd()`.

### Added
- **Prebuilt `dist/` is committed to `dev`** — the compiled JavaScript output is now tracked in git so consumers receive a runnable package directly from `git clone` or tarball extraction, with no install-time TypeScript compilation required.
- **First-run version stamp inside the CLI** — new `src/cli/install-stamp.ts` runs at the top of every `omx` invocation, replacing the previous npm-postinstall hook. The stamp is written on first run after install/upgrade and is silently skipped on subsequent runs when the recorded version matches the current `package.json` version.
- **Prominent install block in the README** — top-of-README `> [!IMPORTANT]` callout shows two copy-pasteable commands (npm tarball install and Codex marketplace add) with notes that the commands are independent.

### Changed
- **`package.json` metadata repointed to AeyeOps** — `repository.url`, `homepage`, and `bugs.url` now reference `AeyeOps/oh-my-codex`. Original `Yeachan Heo` remains the `author`; `AeyeOps` is added to `contributors`.

### Removed
- **`prepare` lifecycle script** — no longer needed once `dist/` is committed. Eliminates exposure to the npm 11 git-dep prepare PATH bug, where bare `tsc` falls through to a system TypeScript (e.g., 4.8.4) instead of resolving `node_modules/.bin/tsc` (the pinned 6.0.3).
- **`postinstall` lifecycle script** and its `postinstall-bootstrap.js` shim — replaced by the first-run version stamp. Eliminates exposure to the `ENOENT: no such file or directory, uv_cwd` crash that fired when npm cleaned up the temp clone before postinstall could execute.

### Fixed
- **`npm install -g https://github.com/AeyeOps/oh-my-codex/archive/refs/heads/dev.tar.gz`** is now a complete single-command install that puts `omx` on `PATH` with all production dependencies resolved by npm. Verified end-to-end on npm 10.9.7 and 11.13.0.
- **`codex plugin marketplace add https://github.com/AeyeOps/oh-my-codex.git`** registers the Codex plugin assets (slash commands, MCP server configs, hooks) and resolves to the committed `dist/` files without requiring a manual `npm install` inside the marketplace clone.

## 2026-04-26 — Validation pipeline

### Added
- **`npm run validate`** — one-shot pipeline chaining `lint`, `check:no-unused`, and `test` under `set -o pipefail`, capturing combined output to `validate.log` for offline review.

## 2026-04-26 — Fork bootstrap

Initial governance and update-flow divergence from upstream so that consumers of the AeyeOps fork track this fork rather than the upstream npm registry package, and so that upstream-only CI jobs do not accidentally fire on the fork.

### Changed
- **Source new clients from AeyeOps** — onboarding messaging, fork-update guidance, and `omx update` output now point users at `AeyeOps/oh-my-codex` instead of the upstream npm registry package.
- **Fork updates are manual** — `omx update` no longer attempts public-npm auto-update on the AeyeOps fork; printed guidance directs the user to `git pull` and reinstall locally. Escape hatch: set `OMX_ENABLE_PUBLIC_NPM_UPDATE=1` to restore the upstream auto-update behavior.
- **Upstream-only workflows are job-level disabled** — `release.yml`, `pr-check.yml`, and `dev-merge-issue-close.yml` are guarded with `if: github.repository == 'Yeachan-Heo/oh-my-codex'` so the files remain in-tree for upstream-PR cleanliness but never trigger on the AeyeOps fork. `ci.yml` remains active.
- **Dependabot is muted on the fork** — `open-pull-requests-limit: 0` in `.github/dependabot.yml`; repository-level vulnerability alerts disabled via `gh api -X DELETE repos/AeyeOps/oh-my-codex/vulnerability-alerts`. The dependency graph remains on (read-only).

## 2026-04-26 — Plugin runtime hardening

Holds upstream PR [#1943/#1944/#1945](https://github.com/Yeachan-Heo/oh-my-codex/pulls) (rebased clean on `upstream/dev`) on the fork's `dev` branch ahead of an upstream merge, so AeyeOps fork consumers get the plugin-MCP keepalive fix immediately rather than waiting on upstream review cadence.

### Fixed
- **Plugin-launched MCP servers stay alive across Codex sessions** — runtime guards prevent stdio MCP servers from exiting prematurely when the plugin's parent process restarts.
