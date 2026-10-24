# Plan: `@stackra/seo` wave 3

**Spec**: `.agents/specs/sta-348-seo/spec.md`

## Design

- `SeoOptions` (shape) and `SeoConfig$` (field rules only, every field defaulted, so gen can `.extend` it);
  `SeoConfig` is `Config({ schema: SeoOptions })` and registers the schema. Key `seo`.
- Enums `Changefreq` (the protocol's words) and `OgKind` (`site`, `page`, `product`).
- The SEO chain: `resolveSeo(chain, site, config)`: last defined field wins in chain order; title template with a
  literal title; derived canonical, alternates, image; `noindex` forced on a non-indexable site; JSON-LD through
  `serializeJsonLd`.
- `localePath` and `alternates` over `@stackra/i18n`'s `I18nConfig` (locales, default, URL strategy); `alternates` takes
  the route context structurally (`AlternatesContext`).
- `canonicalRedirect(request, canonical)`: 301 or `null`, URL only.
- Robots: `robotsTxt({ groups, sitemap })`, one block per group, line breaks refused.
- Sitemaps: one internal cursor walk (`walkSitemapSource`) behind `sitemapPage` and `sitemapFiles`; the writers escape
  every value (`escapeXml`) and refuse files above the protocol limits (`checkSitemapLimits`).
- Open Graph: `OgRenderer` port and `OgCard` in `./contracts`; one internal pipeline (`renderOgCard`: size check,
  `loadOgFonts`, `ogCardTree`, layout, rasterise) with the engines passed in; `./server` starts resvg from its file,
  `./worker` starts satori and resvg from bundled `.wasm` modules.

## Constitution check

- Boundaries: imports `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/i18n`,
  `@stackra/validation`, zod, satori and `@resvg/resvg-wasm`; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; satori and resvg need catalog entries (owner).
- Naming: v3.1; files `<name>.<kind>.ts`; the driver `<Name>Driver`; one declaration per file.
- Secrets and PII: none.
- No parameter properties and no `#private` fields.
