# AGENTS — @figentra/{{NAME}}

{{DESCRIPTION}} Console app at `apps/{{NAME}}` (`tier:app`).

- Everything lives in `src/`; the `@/` alias points there. Tests sit beside the code in `__tests__/`.
- Routes are code-based React Router 7 (`src/routes.tsx`); no file routing.
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
