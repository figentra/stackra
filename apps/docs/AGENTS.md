# @figentra/docs

<!--
Stackra file contract:
Purpose: the agent notes of @figentra/docs: the docs layout, its checks, the system map and the personal data it holds.
Boundary: this member only; the project rules are in the root AGENTS.md.
Runtime: none
Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0452; root AGENTS.md; stackra-177.
-->

Mintlify documentation site. Tier tag `tier:app`.

## Where code goes

- Pages in `src/docs/` (ADRs in `src/docs/adr/`, served at `/adr/<file>`), images, logos and the brand kit in
  `src/assets/`, snippets in `src/snippets/`, the site configuration in `src/config/docs.config.ts` (a `DocsConfig`
  subclass from `@stackra/gen`). Member files (`README.md`, `AGENTS.md`, `package.json`, `stackra.config.ts`,
  `tsconfig.json`) and scripts (`scripts/`) stay outside `src/`.
- Never write `docs.json`, `llms.txt` or `api-reference/`: gen writes them into `.stackra/site/`, which is never edited
  or committed.
- A new page is an `.mdx` under `src/docs/` plus an entry in a group of `src/config/docs.config.ts`; a new ADR needs no
  entry (the `{ folder: "adr" }` group lists it). Every media file in `src/assets` is referenced by a page (the brand
  kit by `src/docs/brand.mdx`).

## System map (`scripts/system-map/`)

- `render-system-map.ts` (pure) and `write-system-map.ts` (node) turn the merged `SystemGraph` of `@stackra/gen` into
  `index.mdx`, `flows/*.mdx` and `services/<repo>/<member>.mdx` under `src/docs/system-map/`. Those pages are
  generated: never edit them and never list services or flows by hand; change the code or the repo's
  `stackra.flows.json` and run the writer again.
- Read the graph only through `@stackra/gen`'s exported types (`SystemGraph`, `GraphNode`, `GraphFlow`, `GraphEdge`).
- Tests sit in `scripts/system-map/__tests__/`. The console renderer is later work (OS console).

## Rules that fail the build

- gen's refusals (`docs_source_misplaced`, `docs_page_unlisted`, `docs_page_missing`, `docs_asset_unreferenced`, …);
  `pnpm build` (`mint validate`) fails on warnings; `pnpm lint` (`mint broken-links`, `mint a11y`) fails on dead links
  and accessibility errors.
- Versions only from catalogs; `turbo.jsonc` extends `//` with one tier tag.

## Tasks

`pnpm dev`, `build`, `lint`, `format`, `clean`.

## PII

| Data | Where | Notes                                         |
| ---- | ----- | --------------------------------------------- |
| None | —     | The docs site handles no personal data today. |

Revisit when pages embed analytics, forms or user-submitted content.
