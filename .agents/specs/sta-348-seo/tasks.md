# Tasks: `@stackra/seo` wave 3

**Input**: `.agents/specs/sta-348-seo/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-seo/` — covers: AC-001, AC-002 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/cross-cutting/seo` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] [US2] Enums, `SeoOptions`, `SeoConfig$`, `SeoConfig` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] [US4] `Seo`, `JsonLd`, `ResolvedSeo`, `serializeJsonLd`, `resolveSeo`, `localePath`, `alternates`, `canonicalRedirect` — covers: FR-002, FR-005 — route: package — deps: T003
- [x] T005 [US2] Robots and sitemap types, `robotsTxt`, the cursor walk, `sitemapPage`, `sitemapFiles`, the writers — covers: FR-002 — route: package — deps: T003
- [x] T006 [US3] `OgRenderer`, `OgCard`, the card tree, fonts and pipeline, `renderOgImage`, `SatoriOgRendererDriver` — covers: FR-003, FR-004 — route: package — deps: T002
- [x] T007 Stand-in barrels for the four entries — covers: FR-001 to FR-004 — route: package — deps: T004, T005, T006
- [x] T008 Tests beside every subject and the barrel tests — covers: AC-003 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/seo-package.md` — covers: AC-002 — route: package — deps: T007
- [ ] T010 Catalog entries for `satori` and `@resvg/resvg-wasm` (owner), then `pnpm install`, tests, typecheck and build in the separate testing workflow — covers: AC-004 — route: tests — deps: T008
