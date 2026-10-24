# Plan: `@stackra/theming` wave 3

**Spec**: `.agents/specs/sta-348-theming/spec.md`

## Design

- `ThemingOptions` (shape) registers `THEMING_CONFIG_SCHEMA`; `ThemingConfig` is `Config({ schema: ThemingOptions })`;
  the barrel exports the schema as `ThemingConfig$`. Defaults come from `STACKRA_THEME` (`name`, background
  `hexLight`/`hexDark`). Nested values (`themeColor`, `splash`) are interfaces, so overrides assign object literals.
  `logo` is `string | AssetEntry | null`, because the template passes a key on mobile and an entry on web and console.
- `SystemColorScheme` port (`./contracts`): `current()` and `subscribe(listener)`. Drivers: `memory` (core, server and
  tests), `browser` (`./browser`, `matchMedia`), `appearance` (`./native`, React Native `Appearance`). Gen lists the
  one candidate per target, as for `Storage`.
- `ColorSchemeService(config, storage, system)`: reads `prefs.get("theming.scheme")` on every snapshot, falls back to
  `defaultScheme`, resolves `system` through the port, keeps one frozen snapshot until the scheme or its resolution
  changes, watches the port only while subscribed, refuses a scheme not on offer and a default outside `schemes`.
  `initialState()` is the fixed server and hydration snapshot.
- `useColorScheme()` is `useSyncExternalStore(service.subscribe, service.state, service.initialState)`.
- `fakeColorScheme({ scheme, system, config })` builds the real service over `MemoryStorageDriver` and the memory
  driver.

## Constitution check

- Boundaries: imports `@stackra/*` packages' public entries and `zod`, `react`, `react-native` only; no app, service
  or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; no tenant vocabulary beyond the config flag that
  the template names.
- Secrets: none.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).
