# Data model: Core docs move from Mintlify to Fumadocs

**Spec**: `.agents/specs/sta-2026-core-docs-fumadocs/spec.md` · **Linear**: STA-2026 · **Date**: 2026-11-02

No database, table, migration or tenant data. The "entities" are the build inputs and outputs.

## `DocsConfig` (`@stackra/gen`, authored as `apps/docs/src/config/docs.config.ts`)

| Field          | Today (Mintlify)                        | After                                                        |
| -------------- | --------------------------------------- | ------------------------------------------------------------ |
| `name`         | site name                               | unchanged                                                    |
| `description`  | header and search engines               | unchanged; also the `llms.txt` summary line                  |
| `theme`        | Mintlify theme name                     | removed                                                      |
| `colors`       | brand colours                           | unchanged; mapped onto Fumadocs' `--color-fd-*` variables    |
| `logo`         | light and dark paths under `src/assets` | unchanged                                                    |
| `favicon`      | path under `src/assets`                 | unchanged                                                    |
| `navigation`   | tabs and groups                         | unchanged; rendered as `meta.json` per folder                |
| `navbar`       | links and one primary button            | unchanged; rendered as the layout's links                    |
| `footer`       | socials and link columns                | unchanged                                                    |
| `apiReference` | service keys                            | unchanged; pages rendered from each manifest's OpenAPI       |
| `redirects`    | —                                       | new: `{ from, to }[]`, emitted as `_redirects`, default `[]` |
| `raw`          | Mintlify keys gen does not own          | Fumadocs layout options gen does not own                     |

Rules kept: every page listed once; every listed page exists; every media asset referenced; no owned key in `raw`. New
rules: a `redirects` source must not be a page that exists (`docs_redirect_shadows_page`), and a target must be a page
or an absolute URL (`docs_redirect_target_missing`).

## Emitted site (`apps/docs/.stackra/site/`, gitignored)

| Path                          | From                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `content/**.mdx`, `meta.json` | the pages of `src/docs/` and the navigation              |
| `snippets/**`                 | `src/snippets/`                                          |
| `public/**`                   | `src/assets/`, `llms.txt`, `llms-full.txt`, `_redirects` |
| `app/**`                      | the React Router routes, root and layout (a template)    |
| `app/mdx-components.tsx`      | the Fumadocs components plus the Mintlify-name map       |
| `react-router.config.ts`      | `prerender` = every page path                            |
| `vite.config.ts`              | `fumadocs-mdx`, React Router, Tailwind                   |
| `source.config.ts`            | the content folder                                       |
| `build/client/**`             | written by `react-router build`; the Worker's assets     |

## Page identity

A page id is its path under `src/docs/` without the extension. Its URL is `/<id>`, and `index` serves its folder. This
is the same as today (`urlOf` in `emit-docs-site.function.ts`).

## State over the switch

`Mintlify live` → (switch PR merges: the Worker deploys on its verification hostname; Mintlify frozen at its last
deploy) → (owner moves docs.stackra.figentra.com to the Worker) `Worker live` → (clean-up PR) `no Mintlify`.
