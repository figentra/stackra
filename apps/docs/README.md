# @figentra/docs

The Stackra documentation site, built with [Mintlify](https://mintlify.com). Everything Mintlify reads lives in `src/`: `docs.json`, the MDX pages, `snippets/` and `assets/` (logo, favicon, images). The scripts run the `mint` CLI from `src/`.

| Command                                   | Does                                                   |
| ----------------------------------------- | ------------------------------------------------------ |
| `pnpm dev` (or `pnpm docs` from the root) | Local preview on http://localhost:3333                 |
| `pnpm build`                              | `mint validate`, a strict build that fails on warnings |
| `pnpm lint`                               | `mint broken-links`                                    |
| `pnpm format`                             | `oxfmt --write .` (`pnpm format:check` verifies)       |

## System map

`src/system-map/` renders the live system map (STA-845, ADR 0452) from the merged system graph that `@stackra/gen`
writes (`mergeSystemGraphs`): level 1 the whole system (`index.mdx`), level 2 one flow step by step (`flows/<flow>.mdx`)
and level 3 one service (`services/<repo>/<member>.mdx`). The pages are generated, never edited:

```sh
node src/system-map/write-system-map.ts <system.graph.json>
```

Flows are declared once, in each repo's `stackra.flows.json`; a new flow or service appears on the next run.

Add a page: create the `.mdx`, then list it under `navigation` in `docs.json`.
Deploy: connect this repository in the Mintlify dashboard and set the monorepo path to `apps/docs/src`.
