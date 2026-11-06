# Feature Specification: the sort and filter index checks judge this run's resource trees

**Feature Branch**: `figentra/sta-2066-table-index-checks-current`

**Created**: 2026-11-03

**Status**: Planned

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2066

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-20 of the gen coverage audit, gap G-17: `sort_not_indexed` and
`filter_not_indexed` judge the previous committed manifest, not this run's trees. `generateMember` passes `previous`
to `checkTableIndexes`, which reads `previous.ui.resources`. Adding an unindexed sort column must refuse
`sort_not_indexed` in the same gen run, without a committed manifest."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/gen (`checkTableIndexes`, `generateMember`)
- **Public contract change**: none (the refusal codes, messages and fixes are unchanged; they now fire in the run that
  adds the unindexed path instead of the run after it is committed)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (implements ADR 0307 rule 2 and its Enforcement as written)
- **New dependencies**: none
- **Deploy modes**: same in all three (build-time check)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none (packages/experience/panel/README.md and packages/data/database/README.md already say gen
  refuses an unindexed sort or filter path; only gen's file contracts change)
- **Lane**: full
- **Change risk**: R1 (a build-time check fires one run earlier; a member whose committed manifest already passes is
  unaffected, one that would fail on its next run fails now)

## Glossary _(full lane)_

- **Recorded tree**: a resource class's table, form and actions as `readResourceTrees` read them this run, written by
  `resourcesOf` into the manifest's `ui.resources` under `<module>.<model>`.
- **Committed manifest**: the `stackra.manifest.json` on disk before this run (`previous`).
- **This run's manifest**: the manifest `buildManifest` derives in this run (`manifest`).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An unindexed sort is refused in the run that adds it (Priority: P1)

A developer adds `.sortable()` to a column on a path no index leads with and runs `stackra gen`. Gen refuses
`sort_not_indexed` with its fix in that run, whether or not a manifest is committed.

**Why this priority**: today the first run passes and writes the manifest, so the refusal shows up one run later (or
never, on a first run with no committed manifest), after the unindexed table has already been committed.

**Independent Test**: `generateMember` over an IR whose resource tree sorts on an unindexed path, with no committed
manifest.

**Acceptance Scenarios**:

1. **Given** no committed manifest, **When** a resource tree read this run sorts on an unindexed path, **Then**
   `generateMember` returns no files and `sort_not_indexed`.
2. **Given** a committed manifest whose tree sorts on an unindexed path, **When** this run's tree no longer sorts on
   it, **Then** `generateMember` does not refuse `sort_not_indexed`.

---

### Edge Cases

- **EC-01**: a resource the member hosts from a dependency is listed in `ui.resources` under the dependency's
  `<module>.<model>`; no own model carries that key, so it is not judged here (as before).
- **EC-02**: an IR built by hand with no resource trees records identities only; with no table nothing is judged.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen runs the full pass THE `generateMember` function SHALL judge `sort_not_indexed` and `filter_not_indexed` against the resource trees of this run's manifest, not the committed manifest.
- **FR-002**: IF the committed manifest holds a tree that this run no longer records THEN THE check SHALL NOT refuse on it.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a resource tree read this run sorts on an unindexed path and no manifest is committed THE `generateMember` function SHALL refuse `sort_not_indexed` and return no files.
- **AC-002**: WHEN only the committed manifest holds an unindexed sort THE `generateMember` function SHALL NOT refuse `sort_not_indexed`.

## Success Criteria _(mandatory)_

- **SC-001**: the gen unit tests and goldens pass with the check reading this run's manifest — verified by: unit

## Out of scope

- The `ListRows` map and closed `TableInput` (G-53, STA-340).
- Judging relation paths and the trashed filter, and an index's method (unchanged).

## Assumptions

- This run's manifest already carries `ui.resources` with each recorded tree: `buildManifest` calls `resourcesOf`,
  which reads `ir.resourceTrees` filled by `readResourceTrees` before `generateMember` runs. `clientToolsOf` already
  reads the trees from this run's manifest the same way.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent · created from the gen coverage audit (G-17)
- 2026-11-03 · Draft → Clarified · agent · answered from the code and ADR 0307; no owner question
- 2026-11-03 · Clarified → Planned · agent · plan.md written
