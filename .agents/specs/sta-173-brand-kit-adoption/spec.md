# Feature Specification: Brand kit adoption

**Feature Branch**: `figentra/sta-173-apply-brand-kit`

**Created**: 2026-10-20

**Status**: Done

**Linear**: STA-173

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: User description: "Apply the official Stackra brand kit everywhere in the monorepo: @stackra/brand becomes the single source (tokens, HeroUI web and native themes, fonts, logos, marks, icons, app icons), the apps and the app scaffold templates consume it, brand assets stay outside the MIT licence."

## Impact

- **Apps touched**: `apps/mobile` (Uniwind theme, app icon, adaptive icon, splash), `apps/docs` (colours, background, font, wordmark, favicon; ADR 0024 path)
- **Services touched**: none
- **Packages touched**: `packages/experience/brand` (brand kit vendored under `assets/`, exported as `./assets/*`)
- **Public contract change**: additive: `@stackra/brand/assets/*`; `./tokens.css` resolves to `assets/heroui/web.css` with the same properties; `./logos` and `./fonts` point into `assets/public/`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (static files; no secret, no PII)
- **Secrets**: none
- **ADR needed**: no (ADR 0024 decision 2 already excludes brand assets; only its NOTICE path changes)
- **New dependencies**: none (`@stackra/brand` is `workspace:*`)
- **Deploy modes**: same in all three (static assets bundled into each app)
- **Licence tier**: free (code MIT; brand assets all rights reserved per `assets/NOTICE`; fonts OFL)
- **UI surfaces**: mobile theme, icon and splash; docs site theme and logo; app scaffold templates
- **Docs to update**: `apps/docs/src/adr/0024-mit-license-with-exclusions.mdx`
- **Lane**: lite (recorded reason: written after the build at the coordinator's direction; additive static assets and theme config, no runtime logic, although it touches three members)
- **Change risk**: R2 (several members and UI surfaces; ADR 0120 D16)

## User Scenarios & Testing

### User Story 1 - One brand source (Priority: P1)

A builder imports the theme, fonts and marks from `@stackra/brand` and never copies brand values by hand.

**Independent Test**: the brand package tests compare its TypeScript tokens with the kit's resolved tokens and the
HeroUI theme, and check every font file and the NOTICE.

**Acceptance Scenarios**:

1. **Given** the kit's `resolved.json`, **When** the brand tests run, **Then** every Stackra token's light and dark value and hex equal `src/tokens/tokens.ts`.
2. **Given** `assets/public/fonts/fonts.css`, **When** the tests run, **Then** every referenced woff2 and both OFL texts exist.

### User Story 2 - New apps start branded (Priority: P1)

`pnpm new app:<kind>` yields a console, mobile, desktop or docs app that already uses the brand theme, icons and logo.

**Independent Test**: the scaffold tests render each app kind and resolve every `@stackra/brand/assets/…` path they
reference to an existing file.

**Acceptance Scenarios**:

1. **Given** a rendered mobile app, **When** its `app.json` is read, **Then** the icon, adaptive foreground and both splash images are brand files that exist.

### Edge Cases

- **EC-01**: Placeholder copy (the kit's email templates) and unreviewed Arabic are stored but not used by any app.

## Requirements

- **FR-001**: THE `@stackra/brand` package SHALL ship the kit's HeroUI web and native themes, token sources, fonts, logos, marks, app icons, favicons, splash marks, icons, patterns and illustrations under `assets/`, exported as `./assets/*`, AND its TypeScript tokens SHALL equal the kit's resolved tokens.
- **FR-002**: THE brand assets SHALL carry an all-rights-reserved `assets/NOTICE` (ADR 0024), AND the fonts SHALL keep their OFL texts beside them.
- **FR-003**: WHEN an app is scaffolded (console, mobile, desktop, docs) THE template SHALL take its theme, fonts, icons and logo from `@stackra/brand`, AND every brand path it references SHALL exist.

## Success Criteria

- **SC-001**: `apps/mobile` exports with the brand Uniwind theme, icon and splash, and `apps/docs` validates with the brand colours and logo — verified by: e2e (`pnpm verify`: `expo export`, `mint validate`)
- **SC-002**: The icon, splash and theme look right on a device and in the docs site — verified by: manual

## Out of scope

- `apps/console` stays a Node hello-world; only its template is branded.
- Brand fonts on native (Expo cannot load woff2; the kit has no TTF).
- The repo-wide `resources/` → `assets/` convention for other packages (tracked separately).

## Assumptions

- The kit at `.old/brand-kits/stackra` (0.1.0, approved) is the design source; this repo vendors its output byte for byte.

## Amendments

- 2026-10-20 · owner decision: shipped files live in `assets/` (`resource` is reserved for `@Resource`); the package moved from `resources/` before merge.

## Status history

- 2026-10-20 · — → Draft · Claude (builder) · written after the build at the coordinator's direction (lite lane)
- 2026-10-20 · Draft → Clarified · Claude (builder) · scope from the owner request on STA-173
- 2026-10-20 · Clarified → Planned · Claude (builder)
- 2026-10-20 · Planned → Tasked · Claude (builder)
- 2026-10-20 · Tasked → Implementing · Claude (builder)
- 2026-10-20 · Implementing → Done · Claude (builder) · implementation landed before the spec; tests carry the `@covers` tags
