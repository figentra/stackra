# AGENTS — @figentra/{{NAME}}

Expo SDK 57 app at `apps/{{NAME}}` (`tier:app`), in the programming model v3 shape (ADR 0294, 0295): `stackra.config.ts`,
the root module `src/{{NAME}}.module.ts` and the app groups. `src/main.ts`, `src/app.tsx`, `src/navigation/`,
`app.json` and `eas.json` are stand-ins for what gen writes (STA-339); keep them thin.

## Where code goes

| You are writing…      | It goes in…                                                      |
| --------------------- | ---------------------------------------------------------------- |
| A screen              | `src/routes/<name>/<name>.route.ts` (path) and `<name>.tsx` (page) |
| Its params            | `src/navigation/types.ts`, then a navigator in `src/navigation/`   |
| A deep-link path      | the route's `path`, listed in `src/navigation/linking.ts`          |
| Status bar, tab bar   | `src/config/chrome.config.ts`                                      |
| A shared UI primitive | `src/components/<name>/<name>.tsx` with its `index.ts`             |

## Rules that fail the build

- Navigation is code-based React Navigation: no expo-router, no `app/` folder. Navigate with typed `navigation.navigate(...)`.
- Imports that leave a folder use the `#src/*` alias of `package.json` (ADR 0233).
- UI uses HeroUI Native components and Uniwind `className`; colours come from the theme (`useThemeColor`), not literals.
- Native versions must match the SDK (`pnpm doctor`). Versions are `catalog:mobile` / `workspace:*` only.
- `react` stays on the `mobile` catalog (19.2.x): React Native 0.86 pins its renderer to it.

## Tasks

`pnpm turbo run <task> --filter=@figentra/{{NAME}}` — `build`, `typecheck`, `lint`, `format`, `format:check`, `clean`.
Local only: `dev`, `ios`, `android`, `doctor`.

## PII

| Data | Where | Handling                                                                          |
| ---- | ----- | --------------------------------------------------------------------------------- |
| None | —     | Handles no personal data yet. Revisit when it signs users in or stores user data. |
