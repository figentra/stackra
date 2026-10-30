# Feature Specification: registry browser at npm.stackra.figentra.com

**Feature Branch**: `claude/sta-1608-registry-browser-7185e1`

**Created**: 2026-10-29

**Status**: Planned

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1608

**Clarifications status**: complete

**Input**: "A read-only browsing site served by the registry Worker at npm.stackra.figentra.com, so people can browse
our packages as they do on npmjs." The owner chose server-rendered pages with a small inline vanilla script (instant
search, ajax page swaps, a page progress bar and transitions), the full Stackra theme, and English and Arabic (RTL), with no new dependency (2026-10-29).

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: `workers/registry` (`@figentra/worker-registry`) only
- **Services touched**: none
- **Packages touched**: none (the stackra theme values are copied into the Worker, as the landing page already did)
- **Cross-service events**: none
- **Tenancy and data**: none; reads the registry's own D1, KV and R2. No new table, no migration
- **Secrets**: none; a licence token sent as `Authorization` is checked through the existing `LicenceCheck` port and never echoed
- **ADR needed**: no; ADR 0453 already makes the Worker the registry's one host, and the browser adds read-only pages under its read rules
- **New dependencies**: none
- **Deploy modes**: SaaS only (the registry Worker); deployed by `deploy-registry.yml` after the owner says go
- **Lane**: lite
- **Change risk**: R2 (new public routes on a Worker that serves licensed packages; read rules reused unchanged)
- **Licence tier**: free (Figentra infrastructure; it shows Pro packages but ships no Pro code)
- **Docs to update**: `workers/registry/README.md` (routes table, a Browser section, layout row)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse and search the packages (Priority: P1)

A visitor opens `/` and sees every listed package grouped by category, and narrows it with a search.

**Acceptance Scenarios**:

1. **Given** published `@stackra` and `@stackra-pro` packages, **When** `/` is read, **Then** they are listed by category with their latest version, and Pro ones are marked.
2. **Given** a search `q`, **When** `/?q=…` is read, **Then** only names or descriptions containing it are listed.
3. **Given** an `internal` scope (`@figentra`) or an `internal` name rule, **When** `/` is read, **Then** it is not listed.

### User Story 2 - Read one package (Priority: P1)

A visitor opens `/package/@scope/name` and sees its README, versions, dist-tags, dependencies, install command,
provenance and licence.

**Acceptance Scenarios**:

1. **Given** an open package, **When** its page is read, **Then** README, dependencies and provenance (commit, workflow, run) show.
2. **Given** a Pro package and no token that may read it, **When** its page is read, **Then** only catalogue metadata shows (no README, dependencies or provenance) and the licence note says a licence is needed.
3. **Given** a Pro package and a licence token that may read it, **When** its page is read, **Then** the full page shows.
4. **Given** an internal package, **When** its page is read without an internal licence, **Then** it is 404.

### Edge Cases

- Unknown package or scope: an HTML 404.
- npm protocol paths (`/@scope/name`, `/-/…`) answer exactly as before; the browser only takes `/` and `/package/…`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The Worker shall serve the package list at `GET /` and a package page at `GET /package/@scope/name`, both HTML.
- **FR-002**: The list shall show only what the catalogue lists (`open` and `licensed` scopes, no `name_rules` row).
- **FR-003**: A package page shall show README, dependencies and provenance only when `readAccess` allows the request; otherwise catalogue metadata only, or 404 for an internal name.
- **FR-004**: The pages shall run with no external request: inline CSS, inline SVG, one inline script, a CSP that allows only those.
- **FR-005**: The pages shall work without JavaScript; the script only adds instant search and in-place page swaps.
- **FR-006**: No npm protocol route shall change.
- **FR-007**: Every page shall exist in English (no prefix) and Arabic (`/ar/` prefix, `dir="rtl"`), chosen by the URL alone (ADR 0297 decision 4): no redirect, no `Accept-Language`, no `Vary` on locale.
- **FR-008**: The pages shall use the stackra theme values of `@stackra/tokens` (colours light and dark, radius, type scales including the Arabic scale, motion durations and easings) and honour `prefers-reduced-motion`.

## Success Criteria _(mandatory)_

- **SC-001**: Worker tests cover the list, search, the package page, Pro and internal gating, hidden scopes and unchanged npm routes.
- **SC-002**: `pnpm verify` is green.

## Assumptions

- Browsers send no `Authorization` header on navigation, so the full Pro page is for clients that send one; accounts are out of scope.
- No per-package docs page is generated today, so the docs-to-registry link is a follow-up.
