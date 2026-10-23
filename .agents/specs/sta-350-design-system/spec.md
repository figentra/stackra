# Feature Specification: Stackra Design System: design-system category, `@stackra/tokens`, `@stackra/ui`, `apps/playground`

**Feature Branch**: `figentra/sta-350-design-system`

**Created**: 2026-10-23

**Status**: Implementing

**Linear**: STA-350

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner decisions of 2026-10-23, recorded in ADR 0302 in the same pull request. The umbrella name is "Stackra
Design System". Source decisions: ADR 0165 (web client stack, UI contract, form adapters), ADR 0128 (no Storybook), ADR
0227 (not built yet), ADR 0300 (presets), ADR 0024 (brand assets NOTICE), and the retired `@stackra/brand` package.

## Impact

- **Apps touched**: `apps/playground` (new), `apps/mobile` (brand imports become `@stackra/tokens`, app icons move in),
  `apps/docs` (ADR 0302, the logo and brand assets moved in, the regenerated `standards/structure.mdx`)
- **Services touched**: none
- **Packages touched**: `packages/design-system/tokens` (new, `@stackra/tokens`), `packages/design-system/ui` (new,
  `@stackra/ui`), `packages/experience/brand` (deleted, `@stackra/brand` retired)
- **Public contract change**: `@stackra/brand` is removed; `@stackra/tokens` (the token schema, the `stackra` theme and
  the two renderers) and `@stackra/ui` (shared contracts, `./react` and `./native` providers) are added. The
  `design-system` category joins the structure data, the validator and `pnpm new`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: yes, ADR 0302 (written by `docs-adr-steward` in this pull request; records the five owner decisions
  below); the amendment notes it adds to ADR 0165 and the brand records go in the same pull request
- **New dependencies**: a new `e2e` catalog (`@playwright/test` 1.64.1, `@axe-core/playwright` 4.14.0), approved by the
  owner on 2026-10-23; `react-aria-components` in `catalog:frontend` only if `@heroui/react` lacks `I18nProvider`
- **Deploy modes**: none; two libraries and a dev-only app, the same for SaaS, on-prem and air-gapped
- **Licence tier**: the two packages are MIT; the brand assets stay under the ADR 0024 NOTICE in their new homes
- **UI surfaces**: `apps/playground` (the component workbench, not shipped to users)
- **Docs to update**: `apps/docs/src/adr/0302-*.mdx` and its amendment notes, `apps/docs/src/standards/structure.mdx`
  (regenerated), the package READMEs and the `design-system` category README, the roadmap
- **Lane**: lite (recorded reason: the lead chose lite because every decision was taken by the owner on 2026-10-23 and
  is recorded in ADR 0302 in the same pull request; the line count is over the lite guide because most of it is moved
  files)
- **Change risk**: R2 (new packages and a new member, a new dependency catalog, a UI surface)

## Decisions taken by the owner (2026-10-23)

1. **A `design-system` category** holds `packages/design-system/{tokens,ui}` and later `icons`; the umbrella name is
   "Stackra Design System".
2. **`@stackra/ui` is one API.** The contracts live in `src/contracts`; `./react` is built on HeroUI v3 and `./native`
   on HeroUI Native with Uniwind. The packages share the contract, not the component code (ADR 0165; the "shared React
   component library across web and native" row of ADR 0227 stays deferred). Form adapters live there (ADR 0165
   decision 2).
3. **`@stackra/brand` is retired.** Its tokens become the `stackra` theme in `@stackra/tokens` and the fonts move with
   the theme. Logos and brand assets move to `apps/docs`, and app icons to `apps/mobile`. A framework user brings their
   own brand as a theme.
4. **`apps/playground`** is a Vite and React Router app on HeroUI v3 with one route folder per component, a light/dark
   and LTR/RTL switcher, and Playwright with axe end-to-end tests in the app. It is not Storybook (ADR 0128, 0227).
5. **Working mode**: the setup pull request first; then the owner describes components one at a time.

## User Scenarios & Testing

### User Story 1 - Tokens as themes (Priority: P1)

A design-system builder defines a theme once, in the token schema, and gets the HeroUI v3 web variables and the
Uniwind / HeroUI Native theme from it.

**Independent Test**: unit tests over the `stackra` theme values and both renderers; each committed CSS file is compared
with the generator output.

**Acceptance Scenarios**:

1. **Given** the `stackra` theme, **When** the web renderer runs, **Then** it writes the light and dark HeroUI v3
   variables, and the committed CSS equals that output.
2. **Given** the same theme, **When** the native renderer runs, **Then** it writes the light and dark Uniwind theme and
   the committed CSS equals that output.

### User Story 2 - One UI API on web and native (Priority: P1)

An app builder wraps the app in the `@stackra/ui` provider for its platform and gets the theme and the text direction.

**Independent Test**: provider tests on `./react` (theme and direction reach the DOM) and on `./native`.

### User Story 3 - A playground and its e2e (Priority: P1)

A component builder opens `apps/playground`, switches theme and direction, and a Playwright and axe run proves every
route is accessible in all four combinations.

**Independent Test**: the e2e run in `apps/playground`.

### User Story 4 - `@stackra/brand` is gone (Priority: P2)

**Independent Test**: a repository search finds no reference to `@stackra/brand` outside ADRs and historical specs; the
moved assets exist in `apps/docs` and `apps/mobile`.

### Edge Cases

- **EC-01**: A theme that omits a dark variant fails the renderer with the missing token name; nothing is written.
- **EC-02**: A route folder with no matching switcher state is still rendered in all four combinations (the e2e loops
  over the route list, so a new route is covered without editing the test).

## Requirements

- **FR-001**: `@stackra/tokens` SHALL export, from `src/contracts`, the token schema types: a theme, its colour,
  typography, radius, spacing and font tokens, with a light and a dark variant.
- **FR-002**: `@stackra/tokens` SHALL carry the `stackra` theme with token values identical to the retired
  `@stackra/brand` tokens, its fonts moving with it.
- **FR-003**: `@stackra/tokens` SHALL render a theme to HeroUI v3 web CSS variables for light and dark, and the
  committed CSS SHALL equal the generator output.
- **FR-004**: `@stackra/tokens` SHALL render a theme to the Uniwind and HeroUI Native theme for light and dark, and the
  committed CSS SHALL equal the generator output.
- **FR-005**: `@stackra/brand` SHALL be retired: the package is deleted, no reference to it remains outside ADRs and
  historical specs, logos and brand assets live in `apps/docs`, and app icons live in `apps/mobile`.
- **FR-006**: The `design-system` category SHALL exist in `structure.mjs`, `validate-repository.mjs` and the `pnpm new`
  scaffold.
- **FR-007**: `@stackra/ui` SHALL export, from `src/contracts`, the shared types (size, colour or tone, variant, colour
  scheme, direction) and the provider contract.
- **FR-008**: `@stackra/ui/react` SHALL provide the provider wiring on HeroUI v3: the theme and the direction and
  locale.
- **FR-009**: `@stackra/ui/native` SHALL provide the provider wiring on HeroUI Native with Uniwind.
- **FR-010**: `apps/playground` SHALL offer a theme and direction switcher and one route folder per component, the
  first route being the token foundations page.
- **FR-011**: The playground SHALL have a Playwright and axe end-to-end test over every route in light, dark, LTR and
  RTL.

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change — verified by: CI (Quality Gate)
- **SC-002**: The e2e run over every playground route reports no axe violation in the four combinations — verified by: e2e
- **SC-003**: The structure page and the retired package list match the tree — verified by: unit

## Out of scope

- Any component beyond the token foundations page (the owner describes them one at a time after this pull request).
- The `icons` package of the category.
- A shared component implementation across web and native (ADR 0227 keeps it deferred).
- Converting existing apps to the v3 shape (STA-344).

## Assumptions

- `@heroui/react` v3 exposes an `I18nProvider`; if it does not, `react-aria-components` joins `catalog:frontend`, the
  owner having approved that single case.

## Status history

- 2026-10-23 · — → Draft · Claude (spec-writer) · from the owner decisions of 2026-10-23 (lite lane, lead's reason)
- 2026-10-23 · Draft → Clarified · Claude (spec-writer) · no open questions: the owner answered all of them
- 2026-10-23 · Clarified → Planned · Claude (spec-writer)
- 2026-10-23 · Planned → Tasked · Claude (spec-writer)
- 2026-10-23 · Tasked → Implementing · Claude (spec-writer) · setup pull request under way
