# Feature Specification: `@stackra/seo` wave 3, one SEO chain, paged sitemaps, robots groups and Open Graph images

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/seo` (cross-cutting, wave 3) for real: paged sitemaps, robots groups, the JSON-LD escaper,
canonical redirects, `alternates`/`localePath` outside `.server`, one SEO chain (ADR 0301).

## Impact

- **Apps touched**: none (the template's web app consumes it)
- **Services touched**: none
- **Packages touched**: `packages/cross-cutting/seo` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables; the tenant's SEO record is an input of `resolveSeo`, owned by the content service
- **Secrets**: none
- **ADR needed**: no (ADR 0301, 0297, 0294, 0305, 0127 note)
- **New dependencies**: `satori` and `@resvg/resvg-wasm` (Open Graph layout and rasterising), not yet in a catalog,
  referenced as `catalog:`; the rest through `workspace:*` and existing catalogs
- **Deploy modes**: same in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/cross-cutting/seo/README.md`, `packages/cross-cutting/seo/AGENTS.md`; ADR 0120, 0127, 0294, 0297, 0301, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (public page metadata and crawler-facing files; no stored data)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Package row: entries `.`, `./contracts`; the old `./og`, `./robots` and
  `./sitemap` entries fold into standard entries per owner Q4 and the ADR 0127 2026-10-24 note: robots and sitemap into
  `.`, the Node renderer into `./server`, the Worker driver into `./worker`; depends on i18n and config; ADR 0301
  decisions 1 to 7; category cross-cutting per ADR 0127

## User Scenarios & Testing

### User Story 1 - A route's head follows one chain (Priority: P1)

A route returns only what differs (`Seo` from `meta()`); the adapter runs `resolveSeo` over the app defaults, the
static `seo`, `meta()` and the tenant record, and gets the templated title, canonical, alternates, image, `noindex` and
escaped JSON-LD.

**Independent Test**: `src/core/functions/__tests__/resolve-seo.function.test.ts`,
`src/core/functions/__tests__/serialize-json-ld.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** four links, **Then** a later defined field replaces an earlier one, in chain order.
2. **Given** a non-indexable site, **Then** the page is `noindex` whatever a link says.
3. **Given** a JSON-LD value holding `</script>`, **Then** the output holds no `<` or `>` and parses back unchanged.

### User Story 2 - Crawlers get robots groups and paged sitemaps (Priority: P1)

The generated `robots`, `sitemap-index` and `sitemap` route modules call `robotsTxt`, `sitemapFiles`, `sitemapPage`,
`writeSitemap`, `writeSitemapIndex` and `alternates`.

**Independent Test**: the `robots-txt`, `sitemap-files`, `sitemap-page`, `write-sitemap`, `write-sitemap-index`,
`walk-sitemap-source` and `alternates` function tests.

**Acceptance Scenarios**:

1. A rule written for one crawler appears only in that crawler's block; a value with a line break is refused.
2. A source longer than the page size is split into numbered files; page 1 of an empty source is an empty sitemap; a
   page past the end is `null`.
3. A sitemap or index above 50,000 URLs or 50 MB is refused.
4. Each URL carries every locale's alternate and `x-default`, built by the same function the heads use.

### User Story 3 - Open Graph images on a server and a Worker (Priority: P2)

`/og/<kind>/<id>` answers a PNG of the site's card: `renderOgImage` (`./server`) on Node, `SatoriOgRendererDriver`
(`./worker`) behind the `OgRenderer` port on a Worker.

**Independent Test**: `og-card-tree`, `render-og-card`, `load-og-fonts` function tests,
`src/server/functions/__tests__/render-og-image.function.test.ts`,
`src/worker/drivers/__tests__/satori-og-renderer.driver.test.ts`.

### User Story 4 - Canonical redirects and locale paths (Priority: P2)

`canonicalRedirect` answers 301 to the canonical URL or `null`; `localePath` moves a path between locale mounts.

## Requirements

- **FR-001**: The member has entries `.`, `./contracts`, `./server`, `./worker` only (ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports `SeoConfig` (key `seo`), `SeoConfig$`, `Changefreq`, `OgKind`, `Seo`, `alternates`,
  `localePath`, `resolveSeo`, `serializeJsonLd`, `canonicalRedirect`, `robotsTxt`, `sitemapFiles`, `sitemapPage`,
  `writeSitemap`, `writeSitemapIndex` and the sitemap types (`SitemapSource` and the types its signature names).
- **FR-003**: `./contracts` exports `OgRenderer` (key `seo.OgRenderer`) and `OgCard`.
- **FR-004**: `./server` exports `renderOgImage`; `./worker` exports `SatoriOgRendererDriver`.
- **FR-005**: Nothing in `.` uses a Node or Worker API (ADR 0301 decision 6).

## Success Criteria

- **SC-001** (template imports): every symbol the template imports exists with the shape it uses: `.` `Changefreq`,
  `OgKind`, `Seo` (type), `SeoConfig` (override with `titleTemplate`, `robots`, `sitemapPageSize`, `noindexParams`,
  `consumedSitemaps`, `og`, `hreflang`, `jsonLd`), `alternates`, `robotsTxt`, `SitemapSource` (type), `sitemapFiles`,
  `sitemapPage`, `writeSitemap`, `writeSitemapIndex`; `./contracts` `OgRenderer`; `./server` `renderOgImage`;
  `./worker` `SatoriOgRendererDriver`.
- **SC-002** (registry contract): the package row's purpose (paged sitemaps, robots groups, JSON-LD escaper, canonical
  redirects, alternates and locale paths outside `.server`, one SEO chain) is implemented; changeset written.
- **SC-003**: every public symbol has a test beside it in `__tests__/` (run later in the testing workflow).
- **SC-004**: typecheck, lint, build and tests green in the separate testing workflow.

## Out of scope

- The route adapter that turns `ResolvedSeo` into tags and `ctx.redirectToCanonical`: `@stackra/navigation` (W7).
- Gen's `#stackra/sitemap` and the robots, sitemap and OG route modules: `@stackra/gen`.
- Host-chosen OG fonts: the faces are fixed until `@stackra/tokens` ships font files.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
