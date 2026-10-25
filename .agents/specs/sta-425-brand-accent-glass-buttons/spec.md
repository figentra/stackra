# Feature Specification: A steel-blue brand accent and glass buttons on the web

**Feature Branch**: `figentra/sta-425-brand-accent-steel-blue-and-glass-buttons-on-the-web`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-425

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, in chat, looking at the web Button page: "why web buttons like this!?"; from the options offered the owner chose "Accent + glass": the brand's steel blue as the accent, the quiet button variants on the glass material.

## Impact

- **Apps touched**: `apps/docs` (ADR 0319, its index row and navigation; the mail template note); `apps/playground` (the Button page's axe pass in every material mode)
- **Services touched**: none
- **Packages touched**: `packages/design-system/tokens` (the stackra theme's accent family, the web renderer's button rules, the brand record, the regenerated stylesheets)
- **Workers touched**: none
- **Public contract change**: the stackra theme's `accent`, `accent-hover`, `accent-pressed`, `accent-soft`, `accent-soft-foreground` and `focus` values; new HeroUI variant rules in `web.css`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: yes, ADR 0319 (amends the kit's "no accent" rule and ADR 0320 decision 1)
- **New dependencies**: none
- **Deploy modes**: every mode that loads the theme stylesheets
- **Licence tier**: MIT (`@stackra/tokens`)
- **UI surfaces**: every web button and close button; every accent-coloured control on web and native
- **Docs to update**: `packages/design-system/tokens/README.md`
- **Lane**: lite (recorded reason: one theme's values and one renderer block, scoped by the owner in chat)
- **Change risk**: R1 (visual; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person sees the brand in the primary action and glass in the quiet ones (Priority: P1)

A person opens any Stackra web screen and sees the primary button in steel blue with its label readable, and the
secondary, tertiary, outline and ghost buttons as glass over what lies behind them, solid where transparency is
unwanted.

**Independent Test**: the theme test (hue, chroma, contrast) and the web renderer test (the button rules).

**Acceptance Scenarios**:

1. **Given** the stackra theme, **When** a primary button renders, **Then** it is steel blue with its label at 4.5:1.
2. **Given** reduced transparency, **When** a secondary button renders, **Then** it is solid.

### Edge Cases

- **EC-01**: Every pairing the brand kit's contrast report holds to a minimum still meets it with the new accent.

## Requirements

- **FR-001**: THE stackra theme SHALL take the brand's steel hue (248) for its accent family and focus, with
  `accent-foreground` on `accent` at 4.5:1 or more and `focus` on `background` at 3:1 or more in both modes.
- **FR-002**: THE web stylesheet SHALL put HeroUI's secondary, tertiary and outline button variants and the default
  close button on the material's control fill (the thick level, floored at the frosted mode's floor), ghost on hover
  and press, through HeroUI's variant properties, with a hairline edge, no backdrop filter and no box-shadow of its
  own; each label SHALL hold 4.5:1 over pure black and pure white at rest, hover and press in every mode and scheme.

## Success Criteria

- **SC-001**: The Button page passes axe in light, dark, glass, liquid and solid — verified by: e2e

## Out of scope

- The native Button's glass (decided by ADR 0319 decision 3: Liquid Glass on iOS 26 and later, solid elsewhere; built
  by the mobile area).
- Changes to the `@stackra/ui` wrappers.

## Assumptions

- HeroUI v3's button reads `--button-bg`, `--button-bg-hover` and `--button-bg-pressed` per variant (checked against
  `@heroui/styles` 3.2.6 `components/button.css`).

## Status history

- 2026-10-24 · — → Draft · Claude (builder) · from the owner's choice "Accent + glass" (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (builder) · values chosen by contrast
- 2026-10-24 · Clarified → Planned · Claude (builder)
- 2026-10-24 · Planned → Tasked · Claude (builder)
- 2026-10-24 · Tasked → Implementing · Claude (builder)
