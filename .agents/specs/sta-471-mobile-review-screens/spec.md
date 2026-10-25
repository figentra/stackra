# Feature Specification: Mobile review screens for the waves 4-7 free components

**Feature Branch**: `figentra/sta-471-mobile-review-screens-for-the-waves-4-7-free-components`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-471

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: The design-system review app in `apps/mobile` has a page for every Pro component and for the waves 1-3 free
components. The free native components of waves 4 to 7 (overlays, feedback, data display, navigation, layout and the
wave 7 form fields) have none, so nobody can review them on a device.

## Impact

- **Apps touched**: `apps/mobile` (31 screens in `src/screens/free/`, their catalogue rows, routes and deep links, four
  icons, the `@expo/ui` dependency the date fields need at runtime)
- **Services touched**: none
- **Packages touched**: none
- **Workers touched**: none
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none; every screen holds local demo state only
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no, it follows ADR 0310 decision 6 (a review page per component)
- **New dependencies**: none new to the repo; `apps/mobile` declares `@expo/ui` from the existing `mobile` catalog
- **Deploy modes**: none; the review app is internal
- **Licence tier**: the private app
- **UI surfaces**: the design-system review app's Free list
- **Docs to update**: none
- **Lane**: lite (recorded reason: review pages in the private app, no package change)
- **Change risk**: R1 (demo screens; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A reviewer checks a waves 4-7 component on a device (Priority: P1)

A reviewer opens the design-system review app, picks a free component from waves 4 to 7, and sees each of its options
and states, with a live sample whose result is read out.

**Independent Test**: opening each new row of the Free list on a device or simulator.

**Acceptance Scenarios**:

1. **Given** the Free list, **When** the reviewer opens Toast, **Then** each tone, the action and the timeouts show a
   toast.
2. **Given** the Free list, **When** the reviewer opens DatePicker, **Then** the calendar opens and the picked day is
   read out.

### Edge Cases

- **EC-01**: Toast and useConfirmation mount their own provider, since the app root mounts neither.
- **EC-02**: A Free screen whose name matches a Pro screen is imported under a `Free` alias.

## Requirements

- **FR-001**: THE review app SHALL list a page for each free native component of waves 4 to 7, with its catalogue row,
  route and deep link.
- **FR-002**: EACH page SHALL show the component's options and states and one live sample, using only `@stackra/ui`
  components, with no hand styling.

## Success Criteria

- **SC-001**: Every new row opens its page on a device — verified by: manual

## Out of scope

- The Pro screens (ds-pro's) and the Reveal motion screen (STA-430).
- Translated strings: the screens keep English in one `STRINGS` object until `@stackra/i18n` reaches the app.

## Assumptions

- Categories follow the web playground's route files.

## Status history

- 2026-10-24 · — → Draft · Claude (builder) · from the post-#131 mobile cleanup (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (builder)
- 2026-10-24 · Clarified → Planned · Claude (builder)
- 2026-10-24 · Planned → Tasked · Claude (builder)
- 2026-10-24 · Tasked → Implementing · Claude (builder)
