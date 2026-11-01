# Feature Specification: applyChange records break-glass on the revision

**Feature Branch**: `figentra/sta-1692-settings-apply-change-break-glass`

**Created**: 2026-10-31

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1692

**Clarifications status**: complete

**Input**: "OS settings' break-glass action applies through `SettingsResolver#applyChange` (it has no SettingsPage), but
`applyChange` always records `breakGlass: false`, so the audit trail loses the flag." Lead-approved audit fix.

## Status history

- 2026-10-31 → Clarified: lead-approved audit fix requested by the leader

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/settings`
- **Cross-service events**: none
- **Tenancy and data**: none; the revision already has a `breakGlass` column. No migration
- **Secrets**: none
- **ADR needed**: no; it records what ADR 0359 decision 9 already requires
- **New dependencies**: none
- **Deploy modes**: none (library change)
- **Lane**: lite
- **Change risk**: R2 (audit trail of live configuration)
- **Licence tier**: free
- **Docs to update**: none (method docblocks only)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A break-glass change is audited as one (Priority: P1)

An auditor reading the revisions sees `breakGlass: true` on a change applied through `applyChange`.

**Acceptance Scenarios**:

1. **Given** `breakGlass: true` and a reason, **When** `applyChange` runs, **Then** the revision records `breakGlass: true`.
2. **Given** `breakGlass: true` and an empty or blank reason, **When** `applyChange` runs, **Then** it throws a `TypeError` and writes nothing.
3. **Given** no `breakGlass`, **When** `applyChange` runs, **Then** the revision records `false`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `applyChange` meta shall accept `breakGlass`, and record `breakGlass === true` on the revision.
- **FR-002**: `applyChange` shall throw the same `TypeError` as `write` for a break-glass change with a blank reason, before any write.
- **FR-003**: Floors, locks and entitlements shall not change.

## Success Criteria _(mandatory)_

- **SC-001**: Resolver tests cover the three scenarios.
- **SC-002**: `pnpm verify` is green.

## Assumptions

- `SettingsPackService.applyChanges` and the promotable driver keep passing meta through, with `breakGlass` false by default.
