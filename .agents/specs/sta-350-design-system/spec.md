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
  `@stackra/ui`), `packages/experience/brand` (deleted, `@stackra/brand` retired), `packages/tooling/oxlint` (its boundary fixtures
  import `@stackra/tokens` instead of the retired brand package), `packages/tooling/typescript` (the `vite` preset also
  typechecks an app's `e2e/` folder)
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
  owner on 2026-10-23; `react-aria-components` 1.22.1 in `catalog:frontend` (the version `@heroui/react` 3.2.6 resolves
  its peer to), approved by the owner on 2026-10-23 for `@stackra/ui/react`'s `I18nProvider`
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

Wave 1 of the components (ADR 0303; Linear STA-353 to STA-357). Icon, then Text and Heading; Button and Link follow in
their own requirements. The ids continue this list; the wave-1 design briefs numbered each group from 001.

- **FR-012**: `@stackra/ui` SHALL export `IconContractProps`, `IconComponent` and `IconComponentProps` from
  `./contracts`, `ICON_SIZES` from `.`, and an `Icon` from `./react` (lucide-react) and `./native`
  (lucide-react-native) that draws any Lucide icon component, or any component with the same props, at `sm` 16, `md`
  20 or `lg` 24 px and in the colour role of a text tone.
- **FR-013**: An `Icon` without a label SHALL be hidden from assistive technology on both runtimes; with a label it
  SHALL be exposed as an image named by the label (web `role="img"` and `aria-label`; native `accessible`,
  `role="img"` and `accessibilityLabel`).
- **FR-014**: An `Icon` with `isMirroredInRtl` SHALL be drawn mirrored when the direction is right-to-left and
  unmirrored otherwise; an icon without it is never mirrored.
- **FR-015**: Icon slots of `@stackra/ui` components SHALL accept any React element; the native
  `DesignSystemProvider` SHALL give Lucide icons the `md` size and the theme foreground by default, which a native host
  overrides through `LucideProvider`.
- **FR-016**: The playground SHALL have an icon route showing every size, tone, decorative and labelled use, the
  mirrored and never-mirrored directional icons, an app-supplied icon component and a live sample, with e2e checks for
  names, mirroring and 3:1 non-text contrast in light, dark, LTR and RTL.
- **FR-017**: `@stackra/ui/contracts` SHALL export `TextType`, `HeadingType`, `HeadingLevel`, `TextTone`, `TextAlign`,
  `TypographyContractProps`, `TextContractProps` and `HeadingContractProps`.
- **FR-018**: `@stackra/ui/react` SHALL export `Text` and `Heading` on HeroUI v3 Typography implementing the
  contracts; `Heading` renders `h<level>`.
- **FR-019**: `@stackra/ui/native` SHALL export `Text` and `Heading` on HeroUI Native Typography implementing the same
  contracts.
- **FR-020**: The `stackra` theme SHALL define `h4` to `h6` and their `-ar` twins (ADR 0303 decision 9), and the
  `@stackra/tokens` web and native stylesheets SHALL draw HeroUI's Typography types in the theme's type scale, with
  the `-ar` styles for Arabic text.
- **FR-021**: The playground SHALL have a typography route showing every Text type, Heading level and type, tone,
  alignment, truncation and language case, and a live sample, in light, dark, LTR and RTL, and it SHALL group its
  pages by category in the navigation and on the index.
- **FR-022**: `@stackra/ui/contracts` SHALL export `ButtonVariant`, `ButtonContractProps`, `IconButtonContractProps`
  and `CloseButtonContractProps`, and `@stackra/ui/react` SHALL export `Button`, `IconButton` and `CloseButton` on
  HeroUI v3 implementing them: `variant`, `size`, `isDisabled`, `isLoading`, `isFullWidth`, `startIcon`, `endIcon`,
  `label` and `onPress`, with every other HeroUI prop passed through and HeroUI's own names for the renamed concepts
  refused by the type.
- **FR-023**: `@stackra/ui/native` SHALL export `Button`, `IconButton` and `CloseButton` on HeroUI Native implementing
  the same contracts, with HeroUI Native's press feedback (`feedbackVariant`, `animation`, `background`) passed
  through.
- **FR-024**: A loading `Button` SHALL refuse presses, keep focus on web under an unchanged accessible name with a
  hidden spinner, and report `busy` with a spinner in the label colour on native; `IconButton` and `CloseButton`
  SHALL always have a non-empty accessible name, and the type SHALL refuse a missing `label`.
- **FR-025**: `@stackra/ui/contracts` SHALL export `LinkUnderline` and `LinkContractProps`, and `./react` (HeroUI v3
  `Link`) and `./native` (HeroUI Native `LinkButton`) SHALL export a `Link` that maps `tone`, `underline` (default
  `always`), `isExternal`, `label` and `isDisabled`, passing every other HeroUI prop through.
- **FR-026**: `Link` SHALL be router-free: on web an internal, same-origin, unmodified click SHALL navigate through
  React Aria's `RouterProvider`, which `./react` re-exports; on native an app path SHALL navigate through the
  `./native` `RouterProvider`, and an absolute URL or an external link SHALL open in the system browser.
- **FR-027**: The playground SHALL have `/button`, `/icon-button` and `/close-button` routes showing every variant,
  size and state with an interactive example each, listed under the Actions category, in light, dark, LTR and RTL.
- **FR-028**: The playground SHALL have a `/link` route showing every tone, underline, external, disabled, press-only
  and icon-only link, inline in text and standalone, listed under the Navigation category, and its shell and index
  SHALL use the `@stackra/ui` `Link` and `RouterProvider`.

Wave 2 of the components (ADR 0304; Linear STA-358 to STA-360), part 1: Surface, Card and Separator, Chip and
StatusBadge, and Badge. The ids continue this list.

- **FR-029**: `@stackra/ui/contracts` SHALL export `SurfaceVariant`, `SeparatorVariant`, `Orientation`,
  `SurfaceContractProps`, `CardContractProps`, `CardTitleContractProps` and `SeparatorContractProps`.
- **FR-030**: `@stackra/ui/react` SHALL export `Surface`, `Card` (with `Header`, `Title`, `Description`, `Content` and
  `Footer`) and `Separator` on HeroUI v3 implementing the contracts, with every other HeroUI prop passed through.
- **FR-031**: `@stackra/ui/native` SHALL export the same three on HeroUI Native with the same part names (`Card.Content`
  is HeroUI Native's `Card.Body`), the native `Separator` drawing its level with the theme colour.
- **FR-032**: The playground SHALL have `/surface`, `/card` and `/separator` routes showing every level, part,
  orientation and title level with an interactive example each, listed under the Surfaces category, in light, dark,
  LTR and RTL, with an e2e file each.
- **FR-033**: `@stackra/ui/contracts` SHALL export `ChipVariant`, `ChipContractProps` and `StatusBadgeContractProps`.
- **FR-034**: `@stackra/ui/react` SHALL export `Chip` on HeroUI v3 Chip and `StatusBadge` built on it, implementing the
  contracts; a chip is display only and takes no press handler.
- **FR-035**: `@stackra/ui/native` SHALL export `Chip` on HeroUI Native Chip and `StatusBadge` built on it,
  implementing the same contracts.
- **FR-036**: The playground SHALL have `/chip` and `/status-badge` routes showing every variant, tone and size, icons
  and every status tone with an interactive example each, listed under the Status category, in light, dark, LTR and
  RTL, with an e2e file each.
- **FR-037**: `@stackra/ui/contracts` SHALL export `BadgeVariant`, `BadgePlacement`, `BadgeContractProps` and
  `BadgeAnchorContractProps`.
- **FR-038**: `@stackra/ui/react` SHALL export `Badge` with `Badge.Anchor` on HeroUI v3's Badge implementing the
  contracts, its logical `placement` mapped to HeroUI's physical corner by the text direction.
- **FR-039**: `@stackra/ui/native` SHALL export `Badge` with `Badge.Anchor` implementing the same contracts in the
  documented adapted form: a HeroUI Native Chip at the web Badge's sizes, absolutely placed with React Native's logical
  sides in a relative View.
- **FR-040**: The playground SHALL have a `/badge` route showing every variant, tone, size, corner, a dot, text, number
  and icon content, and a badge on a pressable control, listed under the Status category, in light, dark, LTR and RTL,
  with an e2e file.

Wave 2 of the components, part 2 (ADR 0304; Linear STA-361, STA-363, STA-362): Avatar, Spinner, and Skeleton with
SkeletonGroup. The ids continue this list.

- **FR-041**: `@stackra/ui/contracts` SHALL export `AvatarVariant`, `AvatarShape`, `AvatarContractProps`,
  `SpinnerContractProps`, `SkeletonAnimation`, `SkeletonContractProps` and `SkeletonGroupContractProps`, and
  `@stackra/ui` SHALL export `initialsOf`.
- **FR-042**: `@stackra/ui/react` SHALL export `Avatar` and `Spinner` on HeroUI v3, `Skeleton` on HeroUI v3 and
  `SkeletonGroup` in its documented adapted form (HeroUI's single shimmer plus a context), implementing the contracts,
  with every other HeroUI prop passed through.
- **FR-043**: `@stackra/ui/native` SHALL export `Avatar`, `Spinner`, `Skeleton` and `SkeletonGroup` on HeroUI Native
  implementing the same contracts, the motion config (`animation`) passing through.
- **FR-044**: `initialsOf` SHALL return the first letter of the first and last words, upper-cased in the locale, one
  letter for an Arabic-script name and an empty string for a blank name.
- **FR-045**: The `@stackra/tokens` web stylesheet SHALL stop every skeleton animation under `prefers-reduced-motion:
reduce` and run the skeleton sweep from the inline-start side in right-to-left documents.
- **FR-046**: The playground SHALL have `/avatar`, `/spinner` and `/skeleton` routes showing every size, tone,
  variant, shape, animation, fallback, name and state with an interactive example each, listed under the Status
  category, in light, dark, LTR and RTL, with an e2e file each.

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change — verified by: CI (Quality Gate)
- **SC-002**: The e2e run over every playground route reports no axe violation in the four combinations — verified by: e2e
- **SC-003**: The structure page and the retired package list match the tree — verified by: unit
- **SC-004**: axe reports nothing on `/typography` in light, dark, LTR and RTL, and the computed sizes, line heights
  and letter spacings of every Text type and heading style equal the theme's — verified by: e2e
- **SC-005**: axe reports nothing on `/surface`, `/card`, `/separator`, `/chip`, `/status-badge` and `/badge` in light,
  dark, LTR and RTL, and their computed checks hold (surface colours and card shadow, rule sizes, chip text 4.5:1, icon
  sizes, badge corners by direction, dots 3:1, presses reaching the anchor) — verified by: e2e
- **SC-006**: axe reports nothing on `/avatar`, `/spinner` and `/skeleton` in light, dark, LTR and RTL, every avatar
  initials sample reaches 4.5:1 and every spinner tone 3:1, and under reduced motion no spinner or skeleton animates —
  verified by: e2e

## Out of scope

- Any component beyond the token foundations page and the wave-1 components above (the owner describes them one at a
  time; Button and Link are the rest of wave 1).
- The `icons` package of the category.
- A shared component implementation across web and native (ADR 0227 keeps it deferred).
- Converting existing apps to the v3 shape (STA-344).

## Assumptions

- `@heroui/react` 3.2.6 re-exports React Aria's `I18nProvider`, but the owner chose on 2026-10-23 to import it from
  `react-aria-components` directly, pinned to the version HeroUI resolves, so pnpm links one React Aria instance for
  both.

## Status history

- 2026-10-23 · — → Draft · Claude (spec-writer) · from the owner decisions of 2026-10-23 (lite lane, lead's reason)
- 2026-10-23 · Draft → Clarified · Claude (spec-writer) · no open questions: the owner answered all of them
- 2026-10-23 · Clarified → Planned · Claude (spec-writer)
- 2026-10-23 · Planned → Tasked · Claude (spec-writer)
- 2026-10-23 · Tasked → Implementing · Claude (spec-writer) · setup pull request under way
