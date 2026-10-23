# AGENTS — @figentra/{{NAME}}

{{DESCRIPTION}} Console app at `apps/{{NAME}}` (`tier:app`).

- The programming model v3 shape (ADR 0294, 0295): `stackra.config.ts`, the root module `src/{{NAME}}.module.ts`,
  and the app groups (`routes/<name>/`, `components/<name>/`, `config/`, `styles/`, …), each with its first file.
- `src/main.tsx` and `index.html` are stand-ins for what gen writes (STA-339); keep them thin. Never add a `main.ts`
  elsewhere or an entry barrel.
- Imports that leave a folder use the `#src/*` alias of `package.json`; no `@/` alias (ADR 0233). Tests sit beside
  the code in `__tests__/`.
- A route is `routes/<name>/<name>.route.ts` (its path) plus its page `<name>.tsx`; React Router 7 data routers, no
  file routing.
- Screens are panel resources declared in modules (`@Resource`, `@Page`, `@Widget`) and drawn by the panel
  renderer. A hand-written page is the escape hatch, not the default.
- UI comes from HeroUI v3 (`@stackra/ui` once it exists); styles are Tailwind v4 utilities. No other component
  library, no Storybook.
- A component is a folder `x/{x.tsx, index.ts, __tests__/x.test.tsx}`; `XProps` is exported from `x.tsx`.
- Talk to services only through the generated API client, never by importing `services/`.
- Versions only via `catalog:<name>` or `workspace:*`. `tsconfig.json` only extends `@stackra/typescript-config/vite`.
- Tasks: `dev`, `build`, `preview`, `typecheck`, `test`, `lint`, `format`, `format:check`, `clean`.
- Done = `pnpm verify` green. Secrets: none in this app; anything shipped to the browser is public.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
