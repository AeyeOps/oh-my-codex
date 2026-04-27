# AeyeOps fork operations

This fork is managed as an AeyeOps working branch of `oh-my-codex`.

## Automation policy

- Keep CI enabled so direct commits to `main` still get build/test feedback.
- Do not run fork-side release automation.
- Do not run fork-side PR labeling or issue-closing automation.
- Do not run Dependabot automation; dependency refreshes should be manual and intentional.
- Do not auto-sync from upstream. Fetch and rebase/cherry-pick from upstream only on demand.

## Direct fork work

It is acceptable to commit directly to this fork main branch when the fork is acting as the integration branch for local usage.
Keep commits as focused changesets so future upstream contributions can be assembled cleanly.

## Preparing an upstream PR

For upstream contributions, prefer a clean branch based on current upstream `main` and cherry-pick only the changes intended for upstream:

```bash
git fetch upstream
git checkout -b upstream-pr/<topic> upstream/main
git cherry-pick <commit-or-range>
git push origin upstream-pr/<topic>
```

This avoids sending fork-only operational policy, local workflow choices, or unrelated changes upstream.

## Updating clients from the fork

Codex plugin marketplace metadata, skills, MCP metadata, and apps are updated through Codex marketplace source:

```bash
codex plugin marketplace upgrade oh-my-codex-local
```

If a client is still pointed at the upstream marketplace source, rewire it once:

```bash
codex plugin marketplace remove oh-my-codex-local
codex plugin marketplace add AeyeOps/oh-my-codex
```

The global `omx` runtime is an npm-style Node package install. For this fork, update it from a local fork checkout rather than from the public npm package:

```bash
cd <oh-my-codex-fork-checkout>
git pull --ff-only origin main
npm ci
npm run build
npm install -g .
omx setup
```

Restart Codex after refreshing plugin or runtime surfaces.
