# Bug Specification: an entryless package builds

**Feature Branch**: `figentra/sta-1753-entryless-package-build`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1753

**Clarifications status**: complete

**Input**: Leader, core 0.2.1 additions (2026-11-01). Juristra's skeleton packages (pack-format, packs and the `*-ui`
packages) have entry folders with nothing in them yet. Gen writes no entry barrel, so the generated tsdown config has no
entries and tsdown 0.23 falls back to `src/index.ts`, which does not exist: "No input files". tsdown has no no-op
mode (an empty config list fails too), so the build cannot be skipped from its config.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (`emit-package-entries.function.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decision 15: gen writes the entry barrels)
- **New dependencies**: none
- **Deploy modes**: build-time tooling only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (only a package with no export at all changes: it gains an empty `.` entry)

## Requirements

- **FR-001** When no entry of a package has anything to export, gen writes `.stackra/entry/index.ts` as `export {};`, so
  the generated tsdown config has one entry and the build makes an empty `dist/index.mjs`.
- **FR-002** A package with any export is unchanged.
- **FR-003** A test: the empty package gets exactly that one entry.

## Status history

- 2026-11-01 → Clarified (leader's 0.2.1 additions)
