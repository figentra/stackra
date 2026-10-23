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

The programming model v3 shape (ADR 0294 rule R12, decision 14):

```text
stackra.config.ts                  the app definition: targets, area, name (ADR 0295)
index.html                         stand-in until gen writes it; sets the light/dark class before paint
src/
├── {{NAME}}.module.ts             the root module
├── main.tsx                       stand-in entry until gen writes .stackra/entry/browser.ts (STA-339)
├── routes/home/                   home.route.ts (path), home.tsx (page), __tests__/
├── components/panel-shell/        panel-shell.tsx, index.ts, __tests__/panel-shell.test.tsx
└── styles/app.css                 Tailwind + HeroUI styles
```

A route is a folder `routes/<name>/` with `<name>.route.ts` (or `<name>.layout.ts`) and its page `<name>.tsx`; until
gen builds the route tree, `main.tsx` lists the routes. A component is a folder `x/{x.tsx, index.ts,
__tests__/x.test.tsx}` exporting `XProps`. Run from the root with `pnpm --filter @figentra/{{NAME}} dev`.
