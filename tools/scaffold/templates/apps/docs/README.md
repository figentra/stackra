# @figentra/{{NAME}}

{{DESCRIPTION}}

A [Mintlify](https://mintlify.com) documentation site. You write the source; `stackra gen` assembles the site Mintlify
reads into `.stackra/site/` (gitignored, never edited).

| Path                        | Holds                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| `src/config/docs.config.ts` | the site: name, colours, logo, favicon, tabs and navigation, `raw` Mintlify keys |
| `src/docs/`                 | every page; `src/docs/guides/x.mdx` is served at `/guides/x`                   |
| `src/assets/`               | images, logos, favicon; a page references them as `/assets/<path>`            |
| `src/snippets/`             | reusable MDX snippets                                                         |

Dev uses port {{PORT}} (http://localhost:{{PORT}}).

| Command       | Does                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`    | gen in watch mode, then `mint dev` in `.stackra/site`                        |
| `pnpm build`  | gen, then `mint validate`, a strict build that fails on warnings             |
| `pnpm lint`   | gen, then `mint broken-links` and `mint a11y`                                |
| `pnpm format` | `oxfmt --write .` (`pnpm format:check` verifies)                             |

Add a page: create the `.mdx` under `src/docs/`, then list it (or its folder, `{ folder: "guides" }`) in a group of
`src/config/docs.config.ts`. Gen refuses a page no group lists, a listed page that does not exist, an asset no page
references, and a `docs.json` or `README.md` under `src/`.
Deploy: runway's `mintlify` provider pushes `.stackra/site` to the deploy branch the Mintlify GitHub app builds.
