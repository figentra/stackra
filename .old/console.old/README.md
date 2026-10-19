# @stackra/console

The Stackra console: a Vite + React 19 + HeroUI v3 single-page app.

## Tasks

| Script                              | Does                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                          | Vite dev server on http://localhost:3700 (`pnpm console` from the root) |
| `pnpm build`                        | Production build into `dist/`                                           |
| `pnpm preview`                      | Serve the build on port 3700                                            |
| `pnpm typecheck`                    | `tsc --noEmit`                                                          |
| `pnpm lint`                         | `oxlint .`                                                              |
| `pnpm format` / `pnpm format:check` | `oxfmt` write / check                                                   |
| `pnpm test`                         | `vitest run`                                                            |
| `pnpm clean`                        | Remove `dist`, `coverage`, `.turbo`                                     |

## Structure

```
src/
  main.tsx        entry point
  app.tsx         root component
  styles.css      Tailwind + HeroUI styles
  __tests__/      tests
```

## Run

`pnpm install` at the repo root, then `pnpm console`.
