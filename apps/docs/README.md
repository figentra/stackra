# @figentra/docs

The Stackra documentation site, built with [Mintlify](https://mintlify.com). Everything Mintlify reads lives in `src/`: `docs.json`, the MDX pages, `snippets/` and `assets/` (logo, favicon, images). The scripts run the `mint` CLI from `src/`.

| Command                                   | Does                                                   |
| ----------------------------------------- | ------------------------------------------------------ |
| `pnpm dev` (or `pnpm docs` from the root) | Local preview on http://localhost:3333                 |
| `pnpm build`                              | `mint validate`, a strict build that fails on warnings |
| `pnpm lint`                               | `mint broken-links`                                    |
| `pnpm format`                             | `mint format`                                          |

Add a page: create the `.mdx`, then list it under `navigation` in `docs.json`.
Deploy: connect this repository in the Mintlify dashboard and set the monorepo path to `apps/docs/src`.
