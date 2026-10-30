# Feature Specification: Stackra Design System rebrand and showcase redesign

**Feature Branch**: `feat/c6-land` (built on `feat/c6-next-waves`)

**Created**: 2026-10-30

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1371

**Clarifications status**: complete

**Input**: the owner's design-system rebrand and showcase redesign (STA-1371, the showcase redesign spec of
2026-10-27), approved in full ("all approved for now, proceed with no blocker or depend on me", then "do all"). This
spec is written after the build, at the coordinator's direction, so the feat commits of the c6 landing reach a spec
(ADR 0120 D4).

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: `apps/playground` (the web showcase), `apps/mobile` (the mobile showcase), `apps/docs` (brand kit and ADRs)
- **Services touched**: none
- **Packages touched**: `packages/design-system/*` (`@stackra/tokens`, `@stackra/ui`, `@stackra/icons`, `@stackra/showcase`); `@stackra/navigation` (route overlays); lint rules in `@stackra/coding-standard` and `@stackra/oxlint-config`; checks in `@stackra/repo-checks`
- **Cross-service events**: none
- **Tenancy and data**: none; components and showcase data only, no table and no migration
- **Secrets**: none
- **ADR needed**: no new one; ADR 0302, 0303, 0464, 0466 and 0467 govern it
- **New dependencies**: the catalog entries the owner approved for the design system (react-aria, Skia and victory-native for native charts); no others
- **Deploy modes**: all (a library and two showcase apps; nothing is deployed by this change)
- **Licence tier**: free (the Pro showcase moved to figentra/stackra-pro, ADR 0461)
- **Docs to update**: the package READMEs and AGENTS.md files of the design-system members, the playground and mobile READMEs
- **Lane**: lite
- **Change risk**: R2 (a shared UI library every app renders; no data, auth or money path)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - One themed component set on web and native (Priority: P1)

An app renders `@stackra/ui` components and gets the Stackra look, or a brand's, from `@stackra/tokens` alone.

**Acceptance Scenarios**:

1. **Given** a brand theme, **When** an app renders a component, **Then** its colours, type and corner radii come from the theme's tokens (no literal radius, `stackra/no-literal-radius`).
2. **Given** Arabic, **When** a component renders, **Then** it mirrors to right to left.

### User Story 2 - Browse every component in the showcases (Priority: P1)

A developer opens the web playground or the mobile app and finds each component with its demos, API table and code,
in English and Arabic.

**Acceptance Scenarios**:

1. **Given** a registry entry, **When** its page opens, **Then** its demos, API docs and source show, in both languages.
2. **Given** the playground, **When** its e2e suite runs, **Then** every route passes axe in light and dark, left to right and right to left.

## Requirements

- **FR-001**: Components take every colour, font and radius from `@stackra/tokens` roles.
- **FR-002**: Every component works left to right and right to left.
- **FR-003**: The showcase registry is the one source of both showcases' pages, API docs and search, in English and Arabic.

## Success Criteria

- **SC-001**: `pnpm verify` passes on the landing branch.
- **SC-002**: The playground e2e suite passes in full.

## Status history

- 2026-10-30 · — → Draft · Claude (builder) · written after the build at the coordinator's direction (lite lane)
- 2026-10-30 · Draft → Clarified · Claude (builder) · scope from the owner's approval on STA-1371
