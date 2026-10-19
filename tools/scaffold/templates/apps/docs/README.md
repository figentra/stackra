# @stackra/{{NAME}}

{{DESCRIPTION}}

A [Mintlify](https://mintlify.com) documentation site. Everything Mintlify reads lives in `src/`: `docs.json`,
the MDX pages and `assets/` (logo, favicon). The scripts run the `mint` CLI from `src/`.

Dev and preview/start use port {{PORT}} (http://localhost:{{PORT}}).

| Command       | Does                                                   |
| ------------- | ------------------------------------------------------ |
| `pnpm dev`    | Local preview                                          |
| `pnpm build`  | `mint validate`, a strict build that fails on warnings |
| `pnpm lint`   | `mint broken-links`                                    |
| `pnpm format` | `mint format`                                          |
| `pnpm a11y`   | `mint a11y`                                            |

Add a page: create the `.mdx` in `src/`, then list it under `navigation` in `src/docs.json`.
Deploy: connect the repository in the Mintlify dashboard and set the monorepo path to `apps/{{NAME}}/src`.
