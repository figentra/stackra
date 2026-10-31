# Bug Specification: gen reads the kind of an import-type base

**Feature Branch**: `figentra/sta-1738-gen-import-type-kind`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1738

**Clarifications status**: complete

**Input**: Core 0.2.1 release task (leader, 2026-11-01). Commerce · Frontend's till-ui extends a Config class shipped
in a built `.d.mts`, where tsc writes the base as `declare const X_base: import("@stackra/config").ConfigClass<…>`.
`readKind` reads only `type.typeName`, which an ImportType does not have, so the class loses its kind.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (`create-source-reader.function.ts`, `ts-node.type.ts`, one test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (a reader bug fix)
- **New dependencies**: none
- **Deploy modes**: build-time tooling only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (one reader branch, covered by a fixture test)

## Requirements

- **FR-001** A `declare const X_base` typed by an ImportType names its kind by the ImportType's `qualifier`
  (`typeName ?? qualifier`).
- **FR-002** A fixture test: a `.d.mts` package ships such a Config base and a member class extending it reads as
  kind `config`.

## Status history

- 2026-11-01 → Clarified (task from the leader for core 0.2.1)
