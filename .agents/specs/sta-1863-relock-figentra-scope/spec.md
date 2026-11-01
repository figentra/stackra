# Relock pnpm-lock.yaml; core drops @figentra/cli

**Linear**: STA-1863
**Status**: implementing
**Clarifications status**: complete

## Problem

Since the consolidation (STA-1829), every install on main fails with `ERR_PNPM_OUTDATED_LOCKFILE`: the root lists
`@figentra-oss/flow` (pinned 0.1.0, #189) and `@figentra/cli` (0.1.0), and `@stackra/payments` lists `zod`, but the
lockfile has none of them. The lockfile itself is sound: its two YAML documents are pnpm 12's layout (the package
manager's own lock, then the workspace lock), as on main before the consolidation.

`@figentra/cli` is private and unpublished. Since STA-1857 restored the internal-operations scripts, core does not run
it: only `session-context.mjs` and `adr-reserve.mjs` still load it, as leftovers of sta-1748.

## Decision

The leader decided on 2026-11-01: core is a public repository and does not depend on the private CLI. `@figentra/cli`
leaves the root devDependencies and the catalog; when it is published, agents install it globally. With it gone, the
relock needs no token: `@stackra` and `@figentra-oss` are read anonymously from the Stackra registry, and
`@figentra-oss/flow` 0.1.0 is published.

## Change

1. Remove `@figentra/cli` from the root `devDependencies` and from `pnpm-workspace.yaml`'s catalog.
2. `.agents/hooks/session-context.mjs` loads `tools/scripts/ai-spend.mjs` and runs `tools/scripts/linear.mjs digest`
   again, and `tools/scripts/adr-reserve.mjs` imports `gh` from `./pr-merge.mjs`: the forms before sta-1748
   (469aed7b).
3. Regenerate `pnpm-lock.yaml` on testbed box 1 or 7 (`pnpm install --lockfile-only`), never on the Mac.

The guard hooks keep recognising the CLI's forms (`figentra …`, `npx @figentra/cli …`); they guard a command whether
or not core depends on it.

## Acceptance

- `pnpm install --frozen-lockfile` passes in CI and in the deploy workflows.
- No file in core imports `@figentra/cli`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, one hook, one script)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none; no token is needed
- **ADR needed**: no; it defers ADR 0500's CLI move for core, as STA-1857 did
- **New dependencies**: none (the lockfile records `@figentra-oss/flow` and `zod`, which main already lists)
- **Deploy modes**: none changed; every deploy workflow's install starts passing
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: chore
- **Change risk**: R2
