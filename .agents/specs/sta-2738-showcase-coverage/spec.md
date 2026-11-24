# Feature Specification: `showcase:coverage` lists the registry entries whose web showcase is incomplete

**Feature Branch**: `figentra/sta-2738-showcase-coverage`

**Created**: 2026-11-24

**Status**: Draft

**Tier**: small

**Approver**: Tariq · Stackra Lead

**Linear**: STA-2738

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Linear STA-2738 (child of STA-2705), lane brief step 4 and Tariq's answers of 24 Nov: "`showcase:coverage`: fails
when a showcase entry lacks a playground route, a demo, an English and an Arabic label, or a test. Report the count of
misses; don't fix them yet."

## Problem

The registry gate (`checkRegistry`) proves every playground route maps to an entry and every implied catalogue key
exists, but nothing proves the other direction for the whole entry: that each built entry has its playground route, a
demo file, both labels and a test. A component can ship in the registry with no page to look at and no test, and
nothing says so. The gate also reports missing demos as warnings only.

## Impact

- **Apps touched**: none (reads `apps/playground/src/routes`, `src/demos` and `e2e/__tests__`)
- **Services touched**: none
- **Packages touched**: packages/design-system/showcase (scripts only)
- **Public contract change**: none; a repository script, not an export of the published package
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; reads file names and the two showcase catalogues
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free
- **UI surfaces**: none
- **Docs to update**: the showcase package AGENTS.md command list gains one line
- **Lane**: chore
- **Change risk**: R0

## Requirements

### Functional Requirements

- **FR-001**: WHEN `pnpm showcase:coverage` runs THE script SHALL read every registry entry (the design-system entries and
  the module kits' entries) and list each built entry on the react platform that has at least one gap.
- **FR-002**: THE script SHALL name five gaps: `route` (no folder `<slug>`, or `pro-<slug>` for a pro entry, under
  `apps/playground/src/routes`), `demo` (no demo file under `apps/playground/src/demos/<tier>/<slug>`), `en` and `ar` (the
  entry's title key is missing from that locale's `showcase.json`) and `test`.
- **FR-003**: A `test` SHALL be a test file in `packages/design-system/ui/src/react/<slug>/__tests__/` or a playground
  `e2e/__tests__/<slug>.e2e.test.ts`; the generic `playground.e2e.test.ts` SHALL NOT count.
- **FR-004**: WHEN at least one entry has a gap THE script SHALL print the count of entries and of gaps per kind and exit 1.
- **FR-005**: WHEN no entry has a gap THE script SHALL exit 0.
- **FR-006**: THE script SHALL skip planned entries and entries that are not on the react platform, and print how many
  it skipped.

## Acceptance criteria

- **AC-001**: WHEN an entry has no route, no demo, no `en` title, no `ar` title and no test THE function SHALL return that
  entry with all five gaps.
- **AC-002**: WHEN an entry has all five THE function SHALL return no miss for it.
- **AC-003**: WHEN an entry is planned or native-only THE function SHALL return no miss for it.
- **AC-004**: WHEN an entry is a pro entry THE function SHALL look for the route `pro-<slug>`.

## Success Criteria

- **SC-001**: the unit tests for AC-001 to AC-004 pass on box 1 — verified by: unit
- **SC-002**: the script runs over the real repository on box 1 and the count of misses is recorded in the hand-over — verified by: manual

## Design

### Summary

A pure function decides the misses from names it is given; a small runner reads the folders and prints the report.

### Architecture overview

`scripts/find-showcase-misses.function.ts` (pure), `scripts/coverage.ts` (the runner, with the same `#src` resolver hook as
`scripts/gen.ts`, `loadEntries` and `loadKitEntries`), a root `package.json` script `showcase:coverage`.

### Components and responsibilities

The function owns the rule; the runner owns the file reads and the exit code.

### Files and folders

Under `packages/design-system/showcase/scripts/`: `find-showcase-misses.function.ts`, `showcase-miss.type.ts`,
`showcase-coverage-input.type.ts`, `coverage.ts`, and `__tests__/find-showcase-misses.test.ts`. A root script, not a member
script: a new member task name must go into `turbo.jsonc` and every member of the shape (task-vocabulary rule).

### Data models and migrations

None.

### Contracts

None published.

### Error handling

An unreadable catalogue or folder throws and the script exits 1 with the path.

### Security and tenancy

None.

### Testing strategy

Unit tests of the pure function, one per acceptance criterion.

### Rollout

No changeset: the script is not part of the published package. Reports the miss count; fixes none.

## Tasks

- [ ] T001 `findShowcaseMisses`, its two types and its unit tests in `packages/design-system/showcase/scripts/` — covers: FR-001, FR-002, FR-003, FR-006, AC-001, AC-002, AC-003, AC-004
- [ ] T002 `scripts/coverage.ts` and the root `showcase:coverage` script, run on box 1 — covers: FR-004, FR-005, SC-002
- [ ] T003 One line in the showcase AGENTS.md command list — covers: FR-001

## Out of scope

- Fixing any miss; this piece only reports (Tariq, 24 Nov).
- Native demos and screens, and the Pro tier (the gate there follows its own spec).
- CI: the script is not wired into any workflow yet.

## Assumptions

- The `@stackra/ui` react folder for an entry is named after its slug; an entry whose folder differs shows as a `test` miss
  and the report says so, rather than the script guessing.

## Status history

- 2026-11-24 · — → Draft · Rasim (stk-ui lane) · created from STA-2738 on Tariq's answer of 24 Nov
