# AGENTS — @figentra/playground

The Stackra Design System playground: every @stackra/ui component on its own route, in light and dark and in
left-to-right and right-to-left, checked by Playwright and axe. App at `apps/playground` (`tier:app`, ADR 0302).

- The programming model v3 shape (ADR 0294, 0295): `stackra.config.ts`, the root module `src/playground.module.ts`,
  and the app groups (`routes/<name>/`, `components/<name>/`, `types/`, `styles/`), each with its first file.
- `src/main.tsx` and `index.html` are stand-ins for what gen writes (STA-339); keep them thin. Never add a `main.ts`
  elsewhere or an entry barrel.
- One route folder per component: `routes/<name>/<name>.route.ts` (`extends Route({ path: "/<name>" })`, static `title` and `category`), the page
  `<name>.tsx` whose h1 is the title, and `__tests__/`; its route class names a `category` (see `PageCategory`). Nothing
  else: `components/playground-pages` finds the folder, so the router, the index page and the navigation list it
  with no edit, and the e2e suite lists the folders, so every new route is checked in light, dark, LTR and RTL.
- A page renders the real `@stackra/ui` entries with real props and states. No `*.stories.*`, no story format, no
  Storybook (ADR 0128, 0227).
- Tokens only (`@stackra/tokens` values and the theme's CSS variables), logical properties (`ms`/`me`, `start`/`end`),
  light and dark. Strings sit in one `STRINGS` constant per file until `@stackra/i18n` ships; text in another
  language carries its own `lang`.
- An axe finding is fixed in our code. When it comes from a HeroUI default or a token contrast, report it with the
  numbers; never disable the rule.
- Imports that leave a folder use the `#src/*` alias; no `@/` alias (ADR 0233). Unit tests sit in `__tests__/`
  beside the code; the Playwright suites in `e2e/__tests__/*.e2e.test.ts` (ADR 0022 d3).
- Versions only via `catalog:<name>` or `workspace:*`. `tsconfig.json` only extends `@stackra/typescript-config/vite`.
- Tasks: `dev`, `build`, `preview`, `typecheck`, `test`, `test:e2e`, `lint`, `format`, `format:check`, `clean`.
- Done = `pnpm verify` green and `pnpm --filter @figentra/playground test:e2e` green. Secrets: none.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
