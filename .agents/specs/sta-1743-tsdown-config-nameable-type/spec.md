# Bug Specification: a member can name what library() returns

**Feature Branch**: `figentra/sta-1743-tsdown-config-nameable-type`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1743

**Clarifications status**: complete

**Input**: Core 0.2.1 release task (leader, 2026-11-01). Every OS service failed typecheck with TS2883 on
`export default library(...)` in its `tsdown.config.ts` (the OS services deleted the file to get past it, os
f5e87ffc). `library()` returns tsdown's `UserConfig`; with `declaration: true` (the base preset) tsc must name that type
in the member, which has `@stackra/tsdown-config` but not `tsdown` as a direct dependency, so the name is not portable.

## Impact

- **Apps touched**: none
- **Services touched**: none in core (OS services can restore their `tsdown.config.ts`)
- **Packages touched**: `packages/tooling/tsdown` (`LibraryConfig`, `library()`'s return type, the entry, a type test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: build tooling only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (a type name; the value is unchanged)

## Requirements

- **FR-001** `@stackra/tsdown-config` exports `LibraryConfig`, an interface extending tsdown's `UserConfig`, and
  `library()` returns it, so declaration emit names it from `@stackra/tsdown-config`.
- **FR-002** A type test pins `library()`'s return type to `LibraryConfig`.

## Status history

- 2026-11-01 → Clarified (task from the leader for core 0.2.1)
