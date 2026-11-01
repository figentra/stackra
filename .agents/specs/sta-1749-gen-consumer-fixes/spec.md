# Specification: gen output that consumers can typecheck

**Feature Branch**: `figentra/sta-1749-gen-consumer-fixes`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1749, STA-1750, STA-1751

**Clarifications status**: complete

**Input**: The Services A product gates of 2026-11-01 (box 7, core main e20b4c83; logs in the notes handover
`{pay,billing,tax-move}-gates-2026-11-01`) found three defects in gen's output, each a compile failure in a consumer.
Owner instruction 2026-11-01: fix them all without stopping.

## Impact

- **Apps touched**: none
- **Services touched**: none in core; consumers' generated files change on their next gen
- **Packages touched**: `packages/developer/gen` (the member module, entity and client emitters, their tests)
- **Cross-service events**: none
- **Tenancy and data**: none; no table, column or migration changes
- **Secrets**: none
- **ADR needed**: no (bug fixes to generated output; ADR 0294 decision 26 output stability holds per input)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: none (no authored surface changes)
- **Lane**: lite
- **Change risk**: R1 (generated code only; each fix narrows output to what compiles)

## Requirements

- **FR-001** (STA-1749) The generated member module aliases a dependency's module class that matches the member's own
  module or an earlier import, with the package scope (`PaymentsModule as StackraPaymentsModule`), instead of
  shadowing it or dropping it.
- **FR-002** (STA-1750) A generated entity never redeclares `[OptionalProps]` with a type its base's declaration
  refuses (TS2717).
- **FR-003** (STA-1751) A generated client declares no local constant it never reads (TS6133 under
  `noUnusedLocals`).
- **FR-004** Tests: one per requirement in gen's unit tests.

## Status history

- 2026-11-01 → Clarified (owner instruction)
