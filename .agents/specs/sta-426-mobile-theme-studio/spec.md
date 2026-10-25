# Feature Specification: The mobile Theme Studio in Settings

**Feature Branch**: `figentra/sta-426-mobile-theme-studio`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-426

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, asking for the playground's Theme Studio on mobile: the Settings tab becomes the app's settings and the
native twin of the web studio, applied live.

## Impact

- **Apps touched**: `apps/mobile` (the Settings screen, the theme settings store and its test, the vitest preset and
  `test` script)
- **Services touched**: none
- **Packages touched**: none (reads `deriveTheme` and `themeVariables` from `@stackra/tokens`)
- **Workers touched**: none
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none; the settings live in memory until the app has storage
- **Security and privacy**: none; the JSON import is parsed and validated as a theme before it is applied
- **Secrets**: none
- **ADR needed**: no, it applies ADR 0320's studio and the theme model of `@stackra/tokens` to the mobile app
- **New dependencies**: none in the catalogs; `apps/mobile` names `vitest` (`catalog:quality`) and
  `@stackra/vitest-config` (`workspace:*`) as dev dependencies for its first test
- **Deploy modes**: every mode; native clients only
- **Licence tier**: the private app
- **UI surfaces**: the mobile Settings tab
- **Docs to update**: none
- **Lane**: lite (recorded reason: one screen and its store, scoped by the owner in chat)
- **Change risk**: R1 (visual and local; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person tunes the app's theme on the phone and sees it at once (Priority: P1)

A person opens Settings, picks the appearance and a preset, moves the accent, neutral, radius and faces, and every
screen of the app follows at once. They can undo, redo and reset, share the theme as JSON and paste one back. An
invalid theme lists what is wrong and the last good one stays.

**Independent Test**: the theme settings store test.

**Acceptance Scenarios**:

1. **Given** the default theme, **When** the accent hue changes, **Then** the derived theme's HeroUI variables are
   pushed to Uniwind's light and dark themes.
2. **Given** a pasted JSON theme that fails validation, **When** it is imported, **Then** its problems are listed and
   the current theme stays.

### Edge Cases

- **EC-01**: Undo after reset returns the theme from before the reset.

## Requirements

- **FR-001**: THE mobile Settings screen SHALL offer the studio's knobs (appearance, preset, accent, neutral, radius,
  faces), show the studio's contrast pairs against AA, and apply every change to the app's theme at once. The colour
  scheme and the language are the design-system provider's (`useDesignSystem()`), shared with the review area.
- **FR-002**: THE theme settings store SHALL keep an undo and redo history, reset to the preset, export the theme as
  JSON and import a JSON theme only when it validates, keeping the last good theme otherwise.

## Success Criteria

- **SC-001**: The theme settings store test passes — verified by: unit

## Out of scope

- Keeping the settings between launches (no app storage yet).

## Assumptions

- Uniwind's runtime theme API updates the CSS variables of the light and dark themes in place.

## Status history

- 2026-10-24 · — → Draft · Claude (builder) · from the owner's request for the mobile studio (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (builder) · scope set by the owner in chat
- 2026-10-24 · Clarified → Planned · Claude (builder)
- 2026-10-24 · Planned → Tasked · Claude (builder)
- 2026-10-24 · Tasked → Implementing · Claude (builder)
