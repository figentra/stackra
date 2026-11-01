# Feature Specification: PGlite snapshot, timeouts and workers for service tests

**Feature Branch**: `figentra/sta-1685-testing-compile-cache`

**Created**: 2026-10-30

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1685

**Clarifications status**: complete

**Input**: "The first test in each file takes about 130 s and 23 time out at 5 s." The CPU profile shows contention, not compile cost: every test file boots its own PGlite (3 to 4 s of CPU) at once on a loaded box. The fix starts each memory database from a snapshot built once per migrations set, and gives the unit preset explicit timeouts, the `forks` pool and a worker cap.

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/vitest-config`, `@stackra/database`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none (library and test-only behaviour)
- **Lane**: lite
- **Change risk**: R1 (test-only entry and test preset; every instance still gets its own PGlite)
- **Licence tier**: free
- **Docs to update**: file-contract docblocks, `packages/tooling/vitest/README.md`, `packages/data/database/README.md` (Testing)

## Status history

- 2026-10-30 → Clarified: lead-approved performance fix requested by the leader

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Service tests boot fast and do not time out (Priority: P1)

**Acceptance Scenarios**:

1. **Given** two memory databases of one migrations set, **When** the second is built, **Then** no initdb or migration runs again.
2. **Given** two instances, **Then** a row written in one is not visible in the other.
3. **Given** changed migrations, **Then** a new snapshot is built.
4. **Given** the unit preset, **Then** it sets the `forks` pool, a worker cap (overridable by `STACKRA_TEST_MAX_WORKERS`), `testTimeout` 30 s and `hookTimeout` 60 s.
