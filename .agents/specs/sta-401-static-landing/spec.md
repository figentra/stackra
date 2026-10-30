# Feature Specification: Branded landing and 404 page for the static host

**Feature Branch**: `figentra/sta-401-static-landing`

**Created**: 2026-10-23

**Status**: Done

**Linear**: STA-401

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, in chat: "`/`, `/schemas/` and every unknown path show one branded Stackra page (nothing to see here, a link to the docs, the footer © Figentra Technologies L.L.C), no schema listing, the stackra brand inlined, light and dark, no JS and no external requests; unknown paths use `not_found_handling: 404-page`; the JSON files keep their headers and caching."

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none
- **Workers touched**: `workers/static` (page renderer, site plan, `_headers`, `wrangler.jsonc`)
- **Public contract change**: `/` answers 200 with an HTML page; unknown paths answer 404 with the same page instead of an empty body; JSON paths unchanged
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: static page, no script, meta CSP `default-src 'none'`, no request, no personal data
- **Secrets**: none
- **ADR needed**: no (extends ADR 0284 decision 5 with one `/` cache rule, owner-directed)
- **New dependencies**: none
- **Deploy modes**: SaaS edge only, as ADR 0284
- **Licence tier**: not distributed (UNLICENSED member)
- **UI surfaces**: one static HTML page on `static.stackra.figentra.com`
- **Docs to update**: `workers/static/README.md`, `workers/static/AGENTS.md`
- **Lane**: lite (recorded reason: one small page in one member, scoped by the owner in chat)
- **Change risk**: R1 (public static page, no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person who opens the host sees where to go (Priority: P1)

Someone opens `https://static.stackra.figentra.com/`, `/schemas/` or a mistyped path and sees a Stackra page that says
the host serves files to tools and links to the docs.

**Independent Test**: the page tests build a site from a fixture schema and release and assert both HTML files, the
wordmark, the footer and the absence of any schema listing; the wrangler test asserts `404-page`.

**Acceptance Scenarios**:

1. **Given** the built site, **When** `/` is requested, **Then** index.html answers 200 with a five-minute cache.
2. **Given** the built site, **When** an unknown path is requested, **Then** 404.html answers with status 404.

### Edge Cases

- **EC-01**: A site with schemas and releases still renders a page that names none of them.

## Requirements

- **FR-001**: THE builder SHALL write one self-contained HTML page (Stackra wordmark, stackra theme colours in light
  and dark, `lang="en"`, a docs link, the footer "© Fulers Technologies L.L.C.", no script, no external request, no
  schema listing) as `/index.html` and `/404.html`.
- **FR-002**: THE Worker SHALL serve `/404.html` with status 404 for every unknown path (`not_found_handling:
"404-page"`), and `_headers` SHALL give `/` a short Cache-Control while JSON paths keep their headers and caching.

## Success Criteria

- **SC-001**: After deploy, `/` answers 200 and `/nope` answers 404 with the page — verified by: manual

## Out of scope

- A schema listing or any other HTML page.
- Embedding the Geist font files (the page names Geist first and falls back to the system sans).

## Assumptions

- Workers static assets applies `_headers` rules by request path, a rule without a splat matches one path, and
  `auto-trailing-slash` serves `/index.html` at `/` (Cloudflare docs, Workers static assets, Headers and HTML handling).

## Status history

- 2026-10-23 · — → Draft · Claude (builder) · from STA-401 and the owner's scope change (lite lane)
- 2026-10-23 · Draft → Clarified · Claude (builder) · page text, branding and 404 handling set by the owner
- 2026-10-23 · Clarified → Planned · Claude (builder)
- 2026-10-23 · Planned → Tasked · Claude (builder)
- 2026-10-23 · Tasked → Implementing · Claude (builder)
- 2026-10-23 · Implementing → Done · Claude (builder) · tests green, checked locally with `wrangler dev`
