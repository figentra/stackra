# AGENTS — @figentra/mobile

Expo SDK 57 app at `apps/mobile` (`tier:app`). Code lives in `src/`; the entry is `src/main.ts` (`package.json` `main`).

## Where code goes

| You are writing…                                                                     | It goes in…                                                                                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| A screen                                                                             | `src/screens/<name>-screen.tsx`                                                                                                             |
| A design-system page                                                                 | `src/screens/free/<name>-screen.tsx`, plus a row (category) in `src/screens/design-system-components.ts`; never `@stackra-pro/*` (ADR 0461) |
| A route or its params                                                                | `src/navigation/types.ts`, then a navigator in `src/navigation/`                                                                            |
| A deep-link path                                                                     | `src/navigation/linking.ts`                                                                                                                 |
| A shared UI primitive                                                                | `src/components/ui/`                                                                                                                        |
| The container, a driver the app subclasses, launch and foreground reads of the phone | `src/boot/`                                                                                                                                 |

## Rules that fail the build

- Navigation is code-based React Navigation: no expo-router, no `app/` folder. Navigate with typed `navigation.navigate(...)`.
- UI uses HeroUI Native components and Uniwind `className`; colours come from the theme (`useThemeColor`), not literals.
- Native versions must match the SDK (`pnpm doctor`). Versions are `catalog:mobile` / `workspace:*` only.
- `react` stays on the `mobile` catalog (19.2.x): React Native 0.86 pins its renderer to it. `metro.config.js` pins `react`, `react-native`, HeroUI Native and the other native singletons to this app's copy for the workspace packages (`@stackra/ui`), which carry the web catalog's React in their own `node_modules`: add a new native singleton to its `SINGLETONS` list.
- The app root boots the container (`src/boot/create-app-container.function.ts`, overrides until gen writes the wiring)
  behind the splash and mounts `ContainerProvider`, then `I18nProvider` (the phone's language and region formats, and
  `setLocale`, which saves the account's `account.locale`).
- Native permission strings and the Expo libraries' native settings go in `app.json` through each library's config
  plugin (the camera through expo-camera, the per-app languages through expo-localization); never hand-edit `ios/` or
  `android/` (ADR 0478).
- The app never shows the App Tracking Transparency prompt, so it has no expo-tracking-transparency plugin and no
  `NSUserTrackingUsageDescription`, and `ios.privacyManifests` says `NSPrivacyTracking: false`. `followSystem` reads
  tracking as `denied` without calling the library: `ExpoSystemSettingsDriver` touches it only when a host sets
  `asksForTracking`, because the library's status read itself is fatal (`RCTFatal`) without the usage string.
  expo-tracking-transparency stays a dependency only so Expo autolinks it for `@stackra/platform`. Adding cross-app
  tracking means the plugin, its usage string, a `SystemSettings` driver subclass with `asksForTracking = true`,
  `NSPrivacyTracking: true` with `NSPrivacyTrackingDomains`, and a row in `store/data-collection.yaml`, in one change.
- `app.json` and `eas.json` are hand-written in the shape `stackra gen` emits for a template app (runtime policy
  `fingerprint`, the privacy manifest, `blockedPermissions` with the advertising id; one EAS channel and environment
  per profile, `staging` and `production` store builds). This app has no `stackra.config.ts`, so gen does not write
  them: keep them in step with the template's `.stackra/app.config.ts` and `.stackra/eas.json` by hand. Both stay
  strict JSON (`pnpm validate`, `store build` reads `app.json`).
- The app lock (`AppLockGate` from `@stackra/platform/native`, around the navigator) is off by default; turn it on
  with an `AppLockConfig` subclass in the container, never a flag in a screen. Face ID's usage text is the
  expo-local-authentication plugin entry in `app.json`.
- The app root is `DesignSystemProvider` from `@stackra/ui/native` (it renders `HeroUINativeProvider`), inside `GestureHandlerRootView` and `SafeAreaProvider`; read the scheme and direction with `useDesignSystem()`.

## Tasks

`pnpm turbo run <task> --filter=@figentra/mobile` — `build`, `typecheck`, `lint`, `format`, `format:check`, `clean`.
Local only: `dev`, `ios`, `android`, `doctor`.

## PII

| Data | Where | Handling                                                                          |
| ---- | ----- | --------------------------------------------------------------------------------- |
| None | —     | Handles no personal data yet. Revisit when it signs users in or stores user data. |
