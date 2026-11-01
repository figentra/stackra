# Restore the tools/scripts internal-operations scripts until @figentra/cli publishes

**Linear**: STA-1857
**Status**: implementing
**Clarifications status**: complete

## Problem

The consolidation (STA-1829) merged sta-1748, which moved core's internal-operations scripts into the private
`figentra` CLI (`@figentra/cli`) and pointed the root aliases at it. That package is not published yet (it lives on
figentra/figentra's unmerged branch `chore/figentra-cli`), so on current main:

- `pnpm install` fails: `prepare` runs `figentra agents sync --mcp-only`;
- `pnpm bot:git`, `bot:gh`, `bot:review`, `bot:token`, `pr:merge`, `linear`, `delegate`, `agents:sync`,
  `agents:check`, `ai:spend` and `secrets:import` fail with `figentra: executable file not found`, so no agent can
  push, open a PR or update Linear;
- CI's `check-pr` step and the nightly Linear sync call the CLI too.

## Decision

The leader approved on 2026-11-01 restoring the scripts in core until `@figentra/cli` is published; the owner decides
whether this PR merges or core waits for the CLI.

## Change

- Every file sta-1748 removed from `tools/scripts` comes back at its newest version before the removal, so three edits
  that had no home come back with it: release-automation `59448187` (secrets-import for the vault-keeper, ADR 0480),
  sta-1822 `eccf8e4a` and `aaf9bad8` (linear-reconcile reads every figentra repo, with its test) and flow/core-switch
  `d0143fa9` (agents-sync's constitution is `.flow/constitution.md`).
- The root aliases and `prepare` call `node tools/scripts/…` again; CI's `check-pr` step and `linear-sync.yml` run the
  scripts.
- `@figentra/cli` stays in the root devDependencies, unused until it publishes. The hooks keep guarding both forms.
- STA-1851 (port the three edits into `@figentra/cli`) stays open: the CLI must carry them before the switch is redone.

## Acceptance

- No root script, `prepare`, `ci.yml` or `linear-sync.yml` calls `figentra`.
- Every script a root alias names exists under `tools/scripts`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (root scripts, tools/scripts, two workflows)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none added; the scripts read the same Infisical `/agents` tokens through `infisical run` as before
- **ADR needed**: no; it defers ADR 0500's move of these scripts until the CLI publishes
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: `tools/scripts/README.md`, `.github/workflows/README.md`
- **Lane**: chore
- **Change risk**: R2
