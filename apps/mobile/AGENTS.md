# AGENTS — @figentra/mobile

Expo SDK 57 app at `apps/mobile` (`tier:app`). Code lives in `src/`; the entry is `src/main.ts` (`package.json` `main`).

## Where code goes

| You are writing…      | It goes in…                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| A screen              | `src/screens/<name>-screen.tsx`                                                              |
| A design-system page  | `src/screens/pro/<name>-screen.tsx`, plus a row in `src/screens/design-system-components.ts` |
| A route or its params | `src/navigation/types.ts`, then a navigator in `src/navigation/`                             |
| A deep-link path      | `src/navigation/linking.ts`                                                                  |
| A shared UI primitive | `src/components/ui/`                                                                         |

## Rules that fail the build

- Navigation is code-based React Navigation: no expo-router, no `app/` folder. Navigate with typed `navigation.navigate(...)`.
- UI uses HeroUI Native components and Uniwind `className`; colours come from the theme (`useThemeColor`), not literals.
- Native versions must match the SDK (`pnpm doctor`). Versions are `catalog:mobile` / `workspace:*` only.
- `react` stays on the `mobile` catalog (19.2.x): React Native 0.86 pins its renderer to it. `metro.config.js` pins `react`, `react-native`, HeroUI Native and the other native singletons to this app's copy for the workspace packages (`@stackra/ui`, `@stackra/ui-pro`), which carry the web catalog's React in their own `node_modules`: add a new native singleton to its `SINGLETONS` list.
- The app root is `DesignSystemProvider` from `@stackra/ui/native` (it renders `HeroUINativeProvider`), inside `GestureHandlerRootView` and `SafeAreaProvider`; read the scheme and direction with `useDesignSystem()`.

## Tasks

`pnpm turbo run <task> --filter=@figentra/mobile` — `build`, `typecheck`, `lint`, `format`, `format:check`, `clean`.
Local only: `dev`, `ios`, `android`, `doctor`.

## PII

| Data | Where | Handling                                                                          |
| ---- | ----- | --------------------------------------------------------------------------------- |
| None | —     | Handles no personal data yet. Revisit when it signs users in or stores user data. |
