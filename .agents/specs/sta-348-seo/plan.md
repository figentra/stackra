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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/cross-cutting/seo`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/i18n`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                   |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                                                 |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                                          |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                        |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                      |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                     |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                       |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                    |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                               |

- Boundaries: imports `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/i18n`,
  `@stackra/validation`, zod, satori and `@resvg/resvg-wasm`; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; satori and resvg need catalog entries (owner).
- Naming: v3.1; files `<name>.<kind>.ts`; the driver `<Name>Driver`; one declaration per file.
- Secrets and PII: none.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./server` and `./worker` — Validates: FR-001
- **P-002**: `.` exports `SeoConfig` (key `seo`), `SeoConfig$`, `Changefreq`, `OgKind`, `Seo`, `alternates`, `localePath`, `resolveSeo`, `serializeJsonLd`, `canonicalRedirect`, `robotsTxt`, `sitemapFiles`, `sitemapPage`, `writeSitemap`, `writeSitemapIndex` and the sitemap types — Validates: FR-002
- **P-003**: `./contracts` exports `OgRenderer` (key `seo.OgRenderer`) and `OgCard` — Validates: FR-003
- **P-004**: `./server` exports `renderOgImage`, and `./worker` exports `SatoriOgRendererDriver` — Validates: FR-004
- **P-005**: no file in the `.` entry imports a Node or Worker API (ADR 0301 decision 6) — Validates: FR-005
