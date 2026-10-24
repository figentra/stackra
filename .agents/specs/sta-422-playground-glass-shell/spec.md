# Feature Specification: Playground glass shell, landing gallery and command palette

**Feature Branch**: `figentra/sta-422-playground-redesign-glass-shell-landing-gallery-and-command-palette`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-422

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, in chat: "we need a better layout for the playground than a sidebar and so on ... we need to make our design system playground amazing and glass", later "use stackra branding all the way with better illustrations, patterns", "we need to update the records to introduce it", "header bad on mobile".

## Impact

- **Apps touched**: `apps/playground` (shell, index page, discovery, styles); `apps/docs` (ADR 0320 and its index row)
- **Services touched**: none
- **Packages touched**: `packages/design-system/tokens` (the brand record `brand.json`, one line)
- **Workers touched**: none
- **Public contract change**: none (a dev tool, not deployed); `HomeRoute.title` becomes "Stackra Design System"
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the playground stores nothing and calls nothing
- **Secrets**: none
- **ADR needed**: yes, ADR 0320 (the brand amendment that allows glass on showcase surfaces)
- **New dependencies**: none
- **Deploy modes**: not deployed
- **Licence tier**: not distributed (UNLICENSED member)
- **UI surfaces**: the playground's shell, index page and every component page's chrome
- **Docs to update**: `apps/playground/README.md`
- **Lane**: lite (recorded reason: one app's chrome, owner-scoped in chat; the component pages are untouched)
- **Change risk**: R1 (a dev tool, no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A reviewer finds and walks every component page (Priority: P1)

A reviewer opens the playground and reaches any page from the gallery or the command palette, and walks a category
from page to page, in light or dark, left to right or right to left, on a desk or a phone.

**Independent Test**: the shell, palette, home and discovery unit tests; the playground e2e suite over every route.

**Acceptance Scenarios**:

1. **Given** the index, **When** a gallery link is followed, **Then** the page opens with focus on its h1.
2. **Given** any page, **When** ⌘K or Ctrl+K is pressed and a word typed, **Then** the matches list and Enter opens the
   first.
3. **Given** a component page, **When** it opens, **Then** its category strip marks it and the pager links the pages
   before and after it.

### Edge Cases

- **EC-01**: A category with no description line still lists, and a `/pro-*` page lists after the free ones with a badge.
- **EC-02**: A phone keeps the bar on one row; the display settings fold behind a button.

## Requirements

- **FR-001**: THE shell SHALL replace the sidebar with a floating glass bar (wordmark, search, display settings), a
  command palette, a category strip and a pager on component pages, and keep the scheme and locale in the address.
- **FR-002**: THE index SHALL show a branded hero stage, a live showcase built from `@stackra/ui`, and a gallery of
  every page grouped by category with an All / Free / Pro filter.
- **FR-003**: Discovery SHALL give each page a tier (a `/pro-*` path is Pro) and order pages by category, tier, then
  title.
- **FR-004**: THE glass SHALL stay WCAG 2.2 AA: text contrast holds over it, it turns solid under reduced transparency,
  more contrast or no backdrop filter, motion stops under reduced motion, and every page passes axe in light, dark, LTR
  and RTL.

## Success Criteria

- **SC-001**: Every route passes axe with no violation and nothing incomplete in the four views — verified by: e2e

## Out of scope

- The per-component route folders.
- The glass material as theme tokens (STA-424) and the Theme Studio (STA-423).

## Assumptions

- axe measures text against a flat tint shaped by a mask as a solid background, so the ambient field yields a result
  instead of "incomplete" (checked by hand with axe-core 4.14).

## Status history

- 2026-10-24 · — → Draft · Claude (builder) · from STA-422 and the owner's brief (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (builder) · direction shown to the owner as screenshots; branding and mobile
  feedback folded in
- 2026-10-24 · Clarified → Planned · Claude (builder)
- 2026-10-24 · Planned → Tasked · Claude (builder)
- 2026-10-24 · Tasked → Implementing · Claude (builder)
