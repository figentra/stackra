# Feature Specification: the onboarding checklist console component

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-776 (UI part; the engine is `sta-776-checklist-engine`)

**Clarifications status**: complete

**Input**: A console checklist component over the workflow checklist view.

## Impact

- **Packages touched**: packages/experience/panel
- **Secrets**: none
- **ADR needed**: no (ADR 0424)
- **New dependencies**: none (the component takes the `ChecklistView` shape, so panel does not depend on workflow)
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `OnboardingChecklist` (`@stackra/panel/react`): progress (done of total, or all done), each visible step
  with its translated label and help, open and mark-done buttons, and hide and move buttons for unlocked steps only
  when the viewer may customise; a locked step says it is required.
- **FR-002** Words in `panel::checklist.*` in the seven languages.

## Not built here

- Wiring to the workflow service's progress and customisation actions (the console app's).
- Tests are written but not run (owner mode).
