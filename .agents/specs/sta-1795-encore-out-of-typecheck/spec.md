# Bug Specification: a service typechecks without encore.dev

**Feature Branch**: `figentra/sta-1795-encore-out-of-typecheck`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1795

**Clarifications status**: complete

**Input**: Leader, for 0.2.2 (2026-11-01), from invoicing#4's typecheck: TS2307 on `encore.dev/storage/sqldb`. The
service preset keeps `.stackra/encore` out of a service's program (it has its own tsconfig extending `encore`), but the
generated `.stackra/gen/boot.ts`, inside the program, imports `../encore/<member>/database` for its connection string,
which pulls that file and its `encore.dev` import in. No repository installs `encore.dev` (it is in no catalog; the
Encore deploy path waits on DP2), and core's own services never hit it because they still author `src/main.ts` and get
no boot.

## Impact

- **Apps touched**: none
- **Services touched**: none in core (every products service with a database typechecks)
- **Packages touched**: `packages/developer/gen` (a generated `.stackra/gen/encore-sqldb.d.ts` beside the boot, its
  emitter and test, the `service` golden)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0091/0124: Encore is generated into `.stackra/encore` and stays out of the service program)
- **New dependencies**: none (declaring `encore.dev` per service is the rejected alternative: a new dependency in every
  service for code no service authors)
- **Deploy modes**: build-time tooling only
- **Licence tier**: free
- **Docs to update**: gen README
- **Lane**: bug
- **Change risk**: R1 (a type-only file; the runtime import is unchanged)

## Requirements

- **FR-001** For a service whose boot connects the database, gen writes `.stackra/gen/encore-sqldb.d.ts`: an ambient
  `encore.dev/storage/sqldb` module declaring only what the generated database file uses (`SQLDatabase`, its
  constructor and `connectionString`), so the service program typechecks without `encore.dev`. The Encore program
  (`.stackra/encore`, its own tsconfig) does not include it and keeps the real types.
- **FR-002** No other member gets the file.
- **FR-003** A test; the `service` golden gains the file.

## Status history

- 2026-11-01 → Clarified (leader's 0.2.2 item)
