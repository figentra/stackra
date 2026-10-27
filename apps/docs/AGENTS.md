# @figentra/docs

Mintlify documentation site. Tier tag `tier:app`.

## Where code goes

- Everything Mintlify reads is in `src/`: `docs.json`, MDX pages, `snippets/`, `assets/`, ADRs in `src/adr`.
- A new page is an `.mdx` file plus an entry under `navigation` in `src/docs.json`.

## System map (`src/system-map/`)

- `render-system-map.ts` (pure) and `write-system-map.ts` (node) turn the merged `SystemGraph` of `@stackra/gen` into
  `index.mdx`, `flows/*.mdx` and `services/<repo>/<member>.mdx`. Those pages are generated: never edit them and never
  list services or flows by hand; change the code or the repo's `stackra.flows.json` and run the writer again.
- Read the graph only through `@stackra/gen`'s exported types (`SystemGraph`, `GraphNode`, `GraphFlow`, `GraphEdge`).
- Tests sit in `src/system-map/__tests__/`. The console renderer is later work (OS console).

## Rules that fail the build

- `pnpm build` (`mint validate`) fails on warnings; `pnpm lint` (`mint broken-links`) fails on dead links.
- Versions only from catalogs; `turbo.jsonc` extends `//` with one tier tag.

## Tasks

`pnpm dev`, `build`, `lint`, `format`, `a11y`, `clean`.

## PII

| Data | Where | Notes                                         |
| ---- | ----- | --------------------------------------------- |
| None | —     | The docs site handles no personal data today. |

Revisit when pages embed analytics, forms or user-submitted content.
