# Feature Specification: Button core and pill, Heading and Text tone core

**Feature Branch**: `figentra/sta-2016-stackra-rebrand-c2-stackraui-button-core-and-pill-heading`

**Created**: 2026-11-02

**Status**: Clarified

**Tier**: lite

**Approver**: leader

**Linear**: STA-2016

**Linear project**: none

**Clarifications status**: complete

**Input**: The Stackra rebrand to steel plus a champagne core, owner decisions of 2026-11-02:

- **Q1:** the core marks the engine: headings, the art's core, and the primary call to action.
- **Q2:** pill buttons on the landing.

Brand rules §39 set the large-text rule: `core` only for large text, and `core-strong` for small text, fills and
focus.

## Impact _(mandatory)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui`:
  - `ButtonVariant`, a new `ButtonShape` and a new `TypographyTone` in `contracts/`;
  - the web and native `Button`, `Heading` and `Text`;
  - a core function for the tone class.
- **Public contract change**: additive.
  - `ButtonVariant` gains `core`.
  - `ButtonContractProps` gains `shape`.
  - Text's and Heading's `tone` widens from `TextTone` to `TypographyTone` (`TextTone` plus `core`).
  - Nothing is removed or renamed, and `TextTone` itself is unchanged.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no. This adds values to the existing props vocabulary (ADR 0303 decision 7). The drawing stays
  HeroUI's: the core is HeroUI's primary with a theme class, like `glass`.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT)
- **UI surfaces**: none until a caller passes the new values. The colours arrive with STA-2015 (`@stackra/tokens`):
  `--core*`, the `--color-core*` utilities, the web `.button--core` rule and native `--radius-pill`. Until then a core
  button draws as the primary, a pill keeps the theme's corner, and core text keeps its default colour.
- **Docs to update**: the showcase API pages are generated from the types
- **Lane**: lite
- **Change risk**: R1 (additive values)

## Requirements

- **FR-001** `variant="core"` draws HeroUI's primary filled with the theme's `core-strong`:
  - on the web, by the `button--core` class from `@stackra/tokens`;
  - on native, by the `bg-core-strong` utility, with the accent's label colour (paper on light, ink on dark, as
    `core-foreground`).
  - It stays solid under every material.
- **FR-002** `shape="pill"` draws a full pill: `rounded-[var(--radius-pill)]` on both runtimes (the theme's pill radius, the token form `stackra/no-literal-radius` asks for; native gains `--radius-pill` with STA-2015). The default
  keeps the theme's corner.
- **FR-003** `tone="core"` on Heading draws `text-core` for the looks h1 to h4 (large text), and `text-core-strong`
  for h5 and h6. On Text it always draws `text-core-strong`, so small core text keeps 4.5:1. Native uses the same
  classes, prefixed with `!` as its other tones are.

## Success criteria

- **SC-001** The new tests (`@covers sta-2016:FR-00n`) and every existing Button, Heading and Text test pass on
  ci-box, and the `@stackra/ui` typecheck passes.
- **SC-002** `oxfmt` and `oxlint` are clean.
