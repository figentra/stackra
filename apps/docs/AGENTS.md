# @stackra/docs

Mintlify documentation site. Tier tag `tier:app`.

## Where code goes

- Everything Mintlify reads is in `src/`: `docs.json`, MDX pages, `snippets/`, `assets/`, ADRs in `src/adr`.
- A new page is an `.mdx` file plus an entry under `navigation` in `src/docs.json`.

## Rules that fail the build

- `pnpm build` (`mint validate`) fails on warnings; `pnpm lint` (`mint broken-links`) fails on dead links.
- Versions only from catalogs; `turbo.json` extends `//` with one tier tag.

## Tasks

`pnpm dev`, `build`, `lint`, `format`, `a11y`, `clean`.

## PII

| Data | Where | Notes                                         |
| ---- | ----- | --------------------------------------------- |
| None | —     | The docs site handles no personal data today. |

Revisit when pages embed analytics, forms or user-submitted content.
