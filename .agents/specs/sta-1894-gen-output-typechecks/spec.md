# Bug Specification: gen output type-checks in a consumer

**Feature Branch**: `figentra/sta-1894-gen-output-typechecks`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1894 (with STA-1880)

**Clarifications status**: complete

**Input**: Leader. `tsc --noEmit` on figentra/os services fails only inside gen's output (about 19 errors per service).
Reproduced on the testbed against main with os's `devices` service in a core worktree: the `$Check` (TS2344), the
tsdown TS2883, the `encore.dev` imports and the clients and wiring errors no longer occur on main (fixed by STA-1720,
STA-1743, STA-1751, STA-1666 and the member-module alias); what remains is TS2741 in `.stackra/gen/entities` (6 per
service) in the service's entity file.

## Impact

- **Packages touched**: `@stackra/gen` (`emitEntities`), `@stackra/typescript-config` (a test only)
- **Committed generated files**: the 14 `src/node/entities.gen.ts` of packages with models, and gen's golden files
- **ADR needed**: no (ADR 0097 decision 3, ADR 0295: `.stackra/encore` is never typechecked)
- **Lane**: bug · **Change risk**: R1

## Requirements

- **FR-001** A package's committed entity file never lists `"~defaults"` (its model type has no such key).
- **FR-002** A service's model or addition with a defaulted field gets `"~defaults": { type: "json", persist: false }`.
- **FR-003** The `service` preset never includes `.stackra/encore`.
- **FR-004** The `service` preset turns `declaration` and `declarationMap` off; every other preset keeps base's declarations
  (TS2883: an entity schema's inferred type names `EntityCtor` from @mikro-orm/core, which no service depends on).

## Status history

- 2026-11-01 → Clarified
