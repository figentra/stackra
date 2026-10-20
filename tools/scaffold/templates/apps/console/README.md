# @figentra/{{NAME}}

{{DESCRIPTION}}

A console: Vite + React 19 + React Router 7 (code-based routes) + HeroUI v3 (Tailwind CSS v4). Screens are
Filament-style panel resources: modules declare `@Resource`, `@Page` and `@Widget`, `stackra gen` and the registry
publish them, and a generic panel renderer draws them inside the panel shell. The app talks to services over HTTP
only, through the generated client.

Dev and preview use port {{PORT}} (http://localhost:{{PORT}}).

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

```text
index.html                         shell; sets the light/dark class before paint
src/
├── main.tsx                       mounts the browser router
├── routes.tsx                     the code-based route table: one panel shell, its pages
├── styles.css                     Tailwind + HeroUI styles
└── components/panel-shell/        panel-shell.tsx, index.ts, __tests__/panel-shell.test.tsx
```

A component is a folder `x/{x.tsx, index.ts, __tests__/x.test.tsx}` exporting `XProps`. Run from the root with
`pnpm --filter @figentra/{{NAME}} dev`.
