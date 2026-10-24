# Feature Specification: `@stackra/ui-pro/css`, the HeroUI Pro fixes, and a Pro CSS variable check

**Feature Branch**: `figentra/sta-458-ui-pro-stylesheet`

**Created**: 2026-10-24

**Status**: Done

**Linear**: STA-458

**Linear project**: Stackra Design System

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: The coordinating session, 2026-10-24, while STA-430 waits:

1. Ship the HeroUI Pro style fixes that #131 put in the playground's `app.css` as a `@stackra/ui-pro/css` stylesheet,
   on theme variables only (branding decision (a): grow `@stackra/tokens`).
2. Add a unit test that every CSS variable HeroUI Pro reads is defined.

The playground keeps its copy until ds-web switches its import.

## Impact

- **Apps touched**: none. The playground keeps its copy until ds-web imports the stylesheet.
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui-pro`
- **Public contract change**: a new `./css` export of a private package; nothing imports it yet
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no. It follows ADR 0310, and the branding decision (ADR 0340) is pending elsewhere.
- **New dependencies**: none; `@stackra/tokens` (`workspace:*`) becomes a dev dependency of `@stackra/ui-pro`
- **Deploy modes**: none; a private library
- **Licence tier**: our MIT stylesheet over HeroUI Pro's classes; no HeroUI Pro code is copied
- **Docs to update**: the `@stackra/ui-pro` README (the import order)
- **Lane**: lite
- **Change risk**: R1

## User Scenarios & Testing

- **US1**: An app that imports `@heroui-pro/react/css` and then `@stackra/ui-pro/css` gets HeroUI Pro components that meet
  WCAG 2.2 AA contrast under any theme `@stackra/tokens` renders.
- **US2**: A HeroUI Pro release that reads a CSS variable nothing defines, or renames a class or a `data-*` value that
  the stylesheet targets, fails a unit test instead of rendering wrong.

## Edge cases

- **EC-01**: A variable a component sets inline at runtime is defined by no stylesheet. It is listed with where it is
  set, and the list may hold only variables that no stylesheet defines.
- **EC-02**: A dark region inside a light document keeps HeroUI Pro's dark code colours.

## Requirements

- **FR-001**: `@stackra/ui-pro` SHALL export `./css`, a stylesheet with the HeroUI Pro fixes of #131. Every colour in it
  SHALL be a theme variable or derived from one, never a palette value.
- **FR-002**: A unit test SHALL check the following against the installed HeroUI Pro stylesheet:
  - every `var(--x)` HeroUI Pro reads with no fallback is defined by Pro, Tailwind's theme, HeroUI's theme or the
    Stackra theme, or is set at runtime;
  - `@stackra/ui-pro/css` reads only variables the Stackra theme, Tailwind or Pro defines;
  - it names only Pro classes and `data-*` values that still exist.

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change. Verified by: CI (Quality Gate)

## Out of scope

- Switching the playground to the stylesheet, which is ds-web's.
- Rendering checks: Playwright runs once a page imports the stylesheet.

## Status history

- 2026-10-24 · — → Draft · Claude (ds-pro) · from the coordinator's brief (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (ds-pro) · no open questions; theme variables only, per branding decision (a)
- 2026-10-24 · Clarified → Planned · Claude (ds-pro)
- 2026-10-24 · Planned → Tasked · Claude (ds-pro)
- 2026-10-24 · Tasked → Implementing · Claude (ds-pro)
- 2026-10-24 · Implementing → Done · Claude (ds-pro) · PR #148: independent review PASS at 96ccc82
