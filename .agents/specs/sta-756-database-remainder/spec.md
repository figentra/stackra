# Feature Specification: database remainder (Postgres action stores, sequences, legal-hold purge, seed runner)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-756

**Clarifications status**: complete

**Input**: Postgres `IdempotencyStore` and `RateLimitStore`; gapless sequences wired by gen with a time zone for
yearly series as a setting; purge respects legal holds; `seedState` and `applySeed` so `stackra seed-pack` runs
without `--check`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/data/database, packages/developer/gen, packages/developer/cli
- **Cross-service events**: none
- **Tenancy and data**: action-store keys are pre-scoped (no RLS); the seed ledger holds product defaults only
- **Secrets**: none (the connection is the member's `DATABASE_URL`)
- **ADR needed**: yes, 0394 and 0396 (Accepted)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `PostgresIdempotencyStoreDriver` and `PostgresRateLimitStoreDriver` in `./node`, migration 0002.
- **FR-002** `SequenceTimeZone` port and `connectSequenceTimeZone`; `SequenceService` reads a yearly series' year in the
  owner's zone, else the call's.
- **FR-003** Gen binds `SequenceService` (platform binding), keeps `registerSequences`, refuses `sequence_misplaced`;
  the migration compiler refuses `CREATE SEQUENCE`.
- **FR-004** Gen's boot connects the bound `HoldRegistry` and registers `HoldSubscriber`, so `CrudService.purge` reads
  ids, asks the registry and deletes only cleared ids (the purge path itself shipped in wave 10).
- **FR-005** `seedState` and `applySeed` over `database.seed_records` (migration 0003); a tenant-owned row is never
  overwritten.

## Not built here

- The field-level masking seam (owner decision).
- The ADR 0342 document-number field check: needs a field marker in `@stackra/model`.
- `postgres` in `@stackra/actions`' `STORE_DRIVERS` (actions is not edited here), so runway can select the drivers.
- Each owning package's reader of its seeded product defaults from the ledger.
- Tests, typecheck and build are written but not run (owner mode).
