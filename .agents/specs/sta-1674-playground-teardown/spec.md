# Feature Specification: settle lazy demo imports before teardown

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1674

**Clarifications status**: complete

**Input**: regate 265/1640 (2026-10-30): the playground suite exited 1 with every test passed, from an EnvironmentTeardownError: a lazy demo import (badge-variant.enum.ts) resolved after its test file's environment was torn down.

## Impact

- **Apps touched**: apps/playground (test setup only)
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R0 (test setup only)

## Behaviour

1. A playground setup file awaits vi.dynamicImportSettled() after each test, so every dynamic import a test started (a lazy demo, the knobs playground, a hero) has loaded before the file's environment is torn down.

## Status history

- 2026-10-30: Draft → Clarified
