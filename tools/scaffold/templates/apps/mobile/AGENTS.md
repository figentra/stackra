# AGENTS — @figentra/{{NAME}}

Expo SDK 57 app at `apps/{{NAME}}` (`tier:app`). Code lives in `src/`; the entry is `src/main.ts` (`package.json` `main`).

## Where code goes

| You are writing…      | It goes in…                                                      |
| --------------------- | ---------------------------------------------------------------- |
| A screen              | `src/screens/<name>-screen.tsx`                                  |
| A route or its params | `src/navigation/types.ts`, then a navigator in `src/navigation/` |
| A deep-link path      | `src/navigation/linking.ts`                                      |
| A shared UI primitive | `src/components/ui/`                                             |

## Rules that fail the build

- Navigation is code-based React Navigation: no expo-router, no `app/` folder. Navigate with typed `navigation.navigate(...)`.
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
