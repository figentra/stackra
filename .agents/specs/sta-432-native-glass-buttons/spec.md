# Feature Specification: Glass quiet buttons on native

**Feature Branch**: `figentra/sta-432-native-glass-buttons`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-432

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, choosing "Accent + glass" for the buttons (STA-425, ADR 0319): the native side gets its own mapping.
Refined by the owner on 2026-10-24: "CSS-only material on web with no refraction, Liquid Glass on iOS 26+, solid
elsewhere". So native is Liquid Glass on iOS 26 and later, solid on Android, earlier iOS, under reduced transparency
or more contrast, and while disabled; no blur anywhere. IconButton follows, CloseButton's default is glass, primary
and danger stay solid.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui` (the native `glass/` helpers, Button and CloseButton, IconButton
  through Button, their tests, the optional peer `expo-glass-effect`, the `@stackra/tokens` dependency for the
  material modes)
- **Workers touched**: none
- **Public contract change**: none to the props; the native secondary, tertiary and outline buttons and the default
  close button draw a glass layer through HeroUI Native's `background` prop, which a caller's own `background` replaces
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no, it implements ADR 0319 decision 3 (the native mapping it leaves to the mobile side) with the
  material of ADR 0320 decision 7
- **New dependencies**: none in the catalogs; `@stackra/ui` names `expo-glass-effect` from the existing
  `catalog:mobile` entry as an optional peer, and `@stackra/tokens` as a workspace dependency
- **Deploy modes**: every mode; native clients only
- **Licence tier**: MIT (`@stackra/ui`)
- **UI surfaces**: every native Button, IconButton and CloseButton in the quiet variants
- **Docs to update**: `packages/design-system/ui/README.md`, `packages/design-system/ui/src/native/README.md`
- **Lane**: lite (recorded reason: one look for three wrappers, scoped by the owner in chat)
- **Change risk**: R1 (visual; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person sees the quiet native buttons as glass, and solid when they ask for less transparency (Priority: P1)

A person opens the Stackra mobile app and sees the secondary, tertiary and outline buttons, the icon buttons in those
variants and every close button as Liquid Glass over what lies behind them on iOS 26 and later, and solid elsewhere.
With reduced transparency or more contrast switched on, they turn solid at once, and they never flash glass before
the settings are read.

**Independent Test**: the glass hook tests (`use-glass-material`, `use-glass-button`) and the Button, IconButton and
CloseButton tests.

**Acceptance Scenarios**:

1. **Given** iOS 26 with Liquid Glass, **When** a secondary button renders, **Then** it draws a regular `GlassView`.
2. **Given** Android or iOS before 26, **When** an outline button renders, **Then** it draws HeroUI Native's solid
   look.
3. **Given** reduced transparency or darker system colours, or before those settings have answered, **When** any
   button renders, **Then** it draws HeroUI Native's solid look.

### Edge Cases

- **EC-01**: A caller that passes its own `background` (or `null`) gets it, not the glass.
- **EC-02**: Some iOS 26 betas report Liquid Glass without the API; they get the solid look, not a crash.
- **EC-03**: A disabled quiet button is solid, because HeroUI Native dims the button root that holds the glass.

## Requirements

- **FR-001**: THE native Button SHALL draw its secondary, tertiary and outline variants on Liquid Glass (a regular,
  interactive `GlassView` in the colour scheme) where the platform runs it, and HeroUI Native's solid look elsewhere,
  while disabled, and for primary, ghost, danger and danger-soft; IconButton and CloseButton (tertiary by default)
  follow the same rule.
- **FR-002**: THE native glass SHALL be solid while reduced transparency or darker system colours is on and until
  those settings have answered, and every mounted button SHALL switch together when a setting changes.

## Success Criteria

- **SC-001**: The native button and glass tests pass — verified by: unit

## Out of scope

- The mobile review screens beyond what already renders the buttons.
- Glass on other native controls (sheets, the tab bar).

## Assumptions

- HeroUI Native 1.0.10's Button and CloseButton take a `background` node drawn inside `Button.Background` behind the
  content (checked against `heroui-native` `button.types.d.ts`).

## Status history

- 2026-10-24 · — → Draft · Claude (builder) · from the owner's choice "Accent + glass" (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (builder) · the native mapping set by the owner in chat
- 2026-10-24 · Clarified → Planned · Claude (builder)
- 2026-10-24 · Planned → Tasked · Claude (builder)
- 2026-10-24 · Tasked → Implementing · Claude (builder)
- 2026-10-24 · Implementing (amended) · Claude (builder) · the owner's glass decision: Liquid Glass on iOS 26+, solid
  elsewhere, no blur
