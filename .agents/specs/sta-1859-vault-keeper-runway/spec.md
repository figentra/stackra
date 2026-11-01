# vault-keeper reads the runways through @stackra/runway

**Linear**: STA-1859
**Status**: implementing
**Clarifications status**: complete

## Problem

`tools/scripts/vault-keeper.mjs` (`pnpm vault`, ADR 0480) imports `plan` and `readRunways` from
`tools/scripts/runway.mjs`. That script moved into `@stackra/runway` (ae08e09e, the `runway` binary), where the same
functions are `readRunways` and `deployPlan` in `packages/developer/runway/src/node/functions/`. Since the
consolidation (STA-1829) brought vault-keeper in, `pnpm vault` and its test fail on the missing import.

## Change

`vault-keeper.mjs` imports `readRunways` and `deployPlan` from the runway package's source files, the way the removed
`spec-checks.mjs` loaded `@stackra/repo-checks`: plain Node strips the types (ADR 0421 decision 2), and both files
import only types from `#node`, so no build is needed. `deployPlan` returns what `plan` returned, the same `ci` and
`sync` names and paths. The `./node` entry of `@stackra/runway` exports neither, and the root does not depend on it.

## Acceptance

- `vault-keeper.mjs` imports nothing from `./runway.mjs`.
- `tools/scripts/__tests__/vault-keeper.test.mjs` runs unchanged in `pnpm validate`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (reads `@stackra/runway`'s source; the package is unchanged)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none; names only, as before
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1
