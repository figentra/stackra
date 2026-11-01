# Remove spec-kit leftovers after Figentra Flow

**Linear**: STA-1850
**Status**: implementing
**Clarifications status**: complete

## Problem

Figentra Flow replaced spec-kit (ADR 0510), but the consolidation (STA-1829) kept three pieces that still assume it:

- `stackra doctor` checks the spec-kit `specify` pin (`speckitPin`, `speckitMatches`), which `mise.toml` no longer
  has, so the check always fails. Its test file still imports both helpers but no longer tests them.
- `tools/scripts/spec-checks.mjs` loads `@stackra/repo-checks`' spec functions for the old spec-gate, spec-parse and
  spec-trace wrappers, which are now `@figentra-oss/flow` shims; nothing else imports it.
- `tools/scripts/__tests__/spec-wrappers.test.mjs` compares those old wrappers with the package; the wrappers are gone.

## Change

Mirror what flow/core-switch did to the old `tools/scripts/doctor.mjs`: drop the spec-kit check and its two helpers
from `stackra doctor`. Delete `spec-checks.mjs` and `spec-wrappers.test.mjs`.

## Acceptance

- No `speckit` or `specify` reference remains in `packages/developer/cli/src/node/doctor`.
- `tools/scripts` has no `spec-checks.mjs` and no test that imports it.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/cli (doctor)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; it carries out ADR 0510
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1
