# Commit hooks run oxlint and oxfmt without a workspace install

**Linear**: STA-1865
**Status**: implementing
**Clarifications status**: complete

## Problem

`lefthook.yml` runs `pnpm exec oxfmt --check` and `pnpm exec oxlint`, which need `node_modules` in the checkout. Agents
work in worktrees without an install (no installs on the Mac), so both pre-commit steps fail with `Command "oxlint"
not found`, and STA-1857, STA-1859, STA-1863, STA-1868 and STA-1870 were committed with `--no-verify`.

## Decision

The leader decided on 2026-11-01 that the hooks use oxlint and oxfmt pinned in `mise.toml` at the catalog versions, and
approved `mise install` of exactly those two tools on the Mac (the tools the Mac rule already runs), so this change's
own commit runs the new hooks.

## Change

1. `mise.toml` pins `"npm:oxlint" = "1.86.0"` and `"npm:oxfmt" = "0.71.0"`, the `catalog:quality` versions in
   `pnpm-workspace.yaml`. The npm backend installs the same packages the catalog does; oxlint's JS plugins
   (`packages/tooling/oxlint/src/plugins/*.mjs`) import only Node built-ins, so they load without `node_modules`.
2. `lefthook.yml`'s oxfmt and oxlint steps call `mise exec -- oxfmt` and `mise exec -- oxlint`, and fall back to
   `pnpm exec` where mise is not on PATH.
3. The `commit-msg` hook's commitlint reads the workspace preset (`@stackra/commitlint-config`), so it needs an install;
   without `node_modules/.bin/commitlint` it prints a note and passes, the advisory fallback `shfmt` and `gitleaks`
   already have. The Quality Gate runs commitlint over every commit of the pull request.
4. A `tool-pins` finding in the `config` phase of `stackra check` (`checkToolPins` in `@stackra/repo-checks`): every
   `"npm:<name>" = "<version>"` pin in `mise.toml` names a package that a `pnpm-workspace.yaml` catalog pins at the
   same version, so the hooks and the members never run two versions.

## Acceptance

- A commit in a worktree without `node_modules` runs the oxfmt and oxlint hook steps (after `mise install`).
- `checkToolPins` reports a mise pin whose catalog version differs, or whose package no catalog pins; its unit test
  covers both and the agreeing case.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/repo-checks (one check)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; ADR 0027 already pins CLI tools in mise
- **New dependencies**: none (mise installs the two packages the catalog already pins)
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: the `mise.toml` comment
- **Lane**: chore
- **Change risk**: R1
