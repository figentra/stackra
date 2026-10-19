# @stackra/{{NAME}}

{{DESCRIPTION}}

A Next.js App Router app with React 19, HeroUI v3 and Tailwind CSS v4 (via `@tailwindcss/postcss`). Typed
routes are on. Workspace `@stackra/*` dependencies are compiled from source (`transpilePackages`, derived from
`package.json`).

Dev and preview/start use port {{PORT}} (http://localhost:{{PORT}}).

| Command          | Does                                             |
| ---------------- | ------------------------------------------------ |
| `pnpm dev`       | Dev server                                       |
| `pnpm build`     | Production build in `.next/`                     |
| `pnpm start`     | Serve the production build                       |
| `pnpm typecheck` | `next typegen` (route types) then `tsc --noEmit` |
| `pnpm test`      | Vitest (jsdom)                                   |
| `pnpm lint`      | oxlint                                           |
| `pnpm format`    | oxfmt                                            |

## Structure

| Path                  | Holds                                          |
| --------------------- | ---------------------------------------------- |
| `src/app/layout.tsx`  | Root layout and metadata                       |
| `src/app/page.tsx`    | `/`                                            |
| `src/app/globals.css` | Tailwind + HeroUI styles                       |
| `src/app/__tests__/`  | Tests (a `_`-prefixed folder is never a route) |
| `next.config.ts`      | Typed routes, workspace transpilation          |
| `postcss.config.mjs`  | Tailwind v4 PostCSS plugin                     |

`next-env.d.ts` and `.next/` are generated; both are git-ignored.
