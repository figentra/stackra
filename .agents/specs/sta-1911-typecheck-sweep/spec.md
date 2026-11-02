# Feature Specification: clear the typecheck errors on main

**Feature Branch**: `figentra/sta-1911-typecheck-sweep`

**Created**: 2026-11-01

**Status**: Planned

**Linear**: STA-1911

**Clarifications status**: complete

**Input**: the Quality Gate typecheck now reaches packages it never reached; seven packages and one console file fail.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `actions`, `analytics`, `events`, `identity`, `loyalty-kit`, `skills`, `tenancy`, `console`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Lane**: lite

## Requirements

- `pnpm turbo run typecheck test` passes for the eight packages.
- Tests follow the current APIs; production code changes only in analytics (decorator typing) and console (`unref`).
