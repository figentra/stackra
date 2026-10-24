# Feature Specification: Glass quiet buttons on native

**Feature Branch**: `figentra/sta-432-native-glass-buttons`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-432

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, choosing "Accent + glass" for the buttons (STA-425, ADR 0319): the native side gets its own mapping.
Liquid Glass where the platform has it, else a blur under the `surface` tint at the regular fill share, solid under
reduced transparency and more contrast; IconButton follows, CloseButton's default is glass, primary and danger stay
solid.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui` (the native `glass/` helpers, Button and CloseButton, IconButton
  through Button, their tests, the optional peers `expo-blur` and `expo-glass-effect`, the `@stackra/tokens`
  dependency for the material values)
- **Workers touched**: none
- **Public contract change**: none to the props; the native secondary, tertiary and outline buttons and the default
  close button draw a glass layer through HeroUI Native's `background` prop, which a caller's own `background` replaces
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no, it implements ADR 0319 decision 3 (the native mapping it leaves to the mobile side) with the
  material of ADR 0320 decision 7
- **New dependencies**: none in the catalogs; `@stackra/ui` names `expo-blur` and `expo-glass-effect` from the
  existing `catalog:mobile` entries as optional peers, and `@stackra/tokens` as a workspace dependency
- **Deploy modes**: every mode; native clients only
- **Licence tier**: MIT (`@stackra/ui`)
- **UI surfaces**: every native Button, IconButton and CloseButton in the quiet variants
- **Docs to update**: `packages/design-system/ui/README.md`, `packages/design-system/ui/src/native/README.md`
- **Lane**: lite (recorded reason: one look for three wrappers, scoped by the owner in chat)
- **Change risk**: R1 (visual; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person sees the quiet native buttons as glass, and solid when they ask for less transparency (Priority: P1)

A person opens the Stackra mobile app and sees the secondary, tertiary and outline buttons, the icon buttons in those
variants and every close button as glass over what lies behind them, Liquid Glass on iOS 26, a blur elsewhere. With
reduced transparency or more contrast switched on, they turn solid at once.

**Independent Test**: the glass hook tests (`use-glass-material`, `use-glass-button`) and the Button, IconButton and
CloseButton tests.

**Acceptance Scenarios**:

1. **Given** iOS 26 with Liquid Glass, **When** a secondary button renders, **Then** it draws a regular `GlassView`.
2. **Given** a device without Liquid Glass, **When** an outline button renders, **Then** it draws a blur tinted to the
   colour scheme under the `surface` colour at the regular level's fill share.
3. **Given** reduced transparency, darker system colours or high text contrast, **When** any button renders, **Then**
   it draws HeroUI Native's solid look.

### Edge Cases

- **EC-01**: A caller that passes its own `background` (or `null`) gets it, not the glass.
- **EC-02**: Some iOS 26 betas report Liquid Glass without the API; they get the blur, not a crash.

## Requirements

- **FR-001**: THE native Button SHALL draw its secondary, tertiary and outline variants on the regular glass level,
  as Liquid Glass where the platform runs it, else a blur under the theme's `surface` at the regular fill share, and
  leave primary, ghost, danger and danger-soft on HeroUI Native's look; IconButton and CloseButton (tertiary by
  default) follow the same rule.
- **FR-002**: THE native glass SHALL turn solid while reduced transparency, darker system colours or high text
  contrast is on, and every mounted button SHALL switch together when the setting changes.

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
