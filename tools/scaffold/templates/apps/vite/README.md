# @figentra/{{NAME}}

{{DESCRIPTION}}

A Vite + React 19 + HeroUI v3 single-page app (Tailwind CSS v4). It talks to the Encore app over HTTP only.

Dev and preview/start use port {{PORT}} (http://localhost:{{PORT}}).

| Command          | Does                         |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Dev server                   |
| `pnpm build`     | Production bundle in `dist/` |
| `pnpm preview`   | Serve the built bundle       |
| `pnpm typecheck` | `tsc --noEmit`               |
| `pnpm test`      | Vitest (jsdom)               |
| `pnpm lint`      | oxlint                       |
| `pnpm format`    | oxfmt                        |

## Structure

| Path                | Holds                                         |
| ------------------- | --------------------------------------------- |
| `index.html`        | Shell; sets the light/dark class before paint |
| `src/main.tsx`      | Mounts `<App />`                              |
| `src/app.tsx`       | The root component                            |
| `src/styles.css`    | Tailwind + HeroUI styles                      |
| `src/**/__tests__/` | Tests beside the code                         |

Run from the root with `pnpm --filter @figentra/{{NAME}} dev`.
