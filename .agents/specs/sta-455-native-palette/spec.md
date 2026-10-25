# Feature Specification: Native output for the @stackra/tokens palette

**Feature Branch**: `figentra/sta-455-native-output-for-stackratokens-palette-tokens-product`

**Created**: 2026-10-25

**Status**: Implementing

**Linear**: STA-455

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: ADR 0340's one token engine. A theme's palette (its own accent steps and a product's accent ramp)
reaches the web through `renderWebCss`, which overrides HeroUI's `color-mix` steps of the same name. The native
stylesheet left the palette out, so HeroUI Native painted its own mixes there, and nothing measured them.

## Impact

- **Apps touched**: none (`apps/mobile` loads the regenerated `native.css` it already imports)
- **Services touched**: none
- **Packages touched**: `@stackra/tokens` (`renderNativeCss`, its test, the committed `themes/stackra/native.css`, the
  README)
- **Workers touched**: none
- **Public contract change**: the native stylesheet gains `--color-<name>` for each palette entry; no API change
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no; it applies ADR 0340 (one engine, check what is painted) to the native renderer
- **New dependencies**: none
- **Deploy modes**: every mode; native clients
- **Licence tier**: free (`@stackra/tokens`)
- **UI surfaces**: every native screen that paints an accent soft, hover or palette colour
- **Docs to update**: `packages/design-system/tokens/README.md`
- **Lane**: lite (recorded reason: one renderer change and its snapshot, assigned in the design-system plan)
- **Change risk**: R1 (colours only; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A native screen paints the theme's own accent steps (Priority: P1)

A person opens a native screen with a soft accent chip or alert and sees the theme's accent-soft colours, the same as
on the web, with the label readable in light and dark.

**Independent Test**: the `renderNativeCss` tests.

**Acceptance Scenarios**:

1. **Given** the stackra theme, **When** the native stylesheet is rendered, **Then** each palette entry is a
   `--color-<name>` in both variants with its own value.
2. **Given** the rendered variants, **When** the accent label is measured on the accent, hover and pressed steps and
   the soft pair is measured, **Then** each holds 4.5:1 in both schemes.

### Edge Cases

- **EC-01**: A palette name that HeroUI Native also derives (`accent-soft`) replaces HeroUI's mix; a name it does not
  (`accent-pressed`) only adds a class.

## Requirements

- **FR-001**: `renderNativeCss` SHALL write every palette entry as `--color-<name>` in both colour variants.
- **FR-002**: The accent steps the native stylesheet paints SHALL keep the accent label at 4.5:1, and the soft pair
  likewise, in both schemes, for the stackra theme.

## Success Criteria

- **SC-001**: The `renderNativeCss` tests pass — verified by: unit

## Out of scope

- Pushing the palette at runtime from the mobile Theme Studio (#171's store); that follows once this lands.
- HeroUI Native's mixes for names a theme's palette does not define; `checkTheme` measures the web's.

## Assumptions

- Uniwind lets a `--color-*` variable set in a theme variant override the value HeroUI Native's `@theme` gives it.

## Status history

- 2026-10-25 · — → Draft · Claude (builder) · from STA-455 (lite lane)
- 2026-10-25 · Draft → Clarified · Claude (builder)
- 2026-10-25 · Clarified → Planned · Claude (builder)
- 2026-10-25 · Planned → Tasked · Claude (builder)
- 2026-10-25 · Tasked → Implementing · Claude (builder)
