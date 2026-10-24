# Plan: `@stackra/feature-flags` wave 2

**Spec**: `.agents/specs/sta-348-feature-flags/spec.md`

## Design

- `Flag` is `createKind("flag", FlagBase, readFlagOptions)`, cast so that it can only be called. `readFlagOptions`
  checks that `expires` is a real day and that `scopes` is not empty, fills in the defaults (`DEFAULT_FLAG_SCOPES`)
  and records the options for `kindOf`.
- `flagRefs(tree)` builds a frozen `FlagRef` for each entry. A class gives `key = <module>.<name>`, label
  `<module>::flags.<name>.label` and its recorded options. A written-out input is kept as given, with the defaults
  filled in. `FlagRefs<T>` types each key literally.
- `FlagProvider` (`./contracts`) carries the type-only `~key` `feature_flags.FlagProvider`. `FlagProviderName`
  augments `DriverRegistry` with `"config" | "posthog"`, the same names gen writes, so `DriverName<FlagProvider>`
  type-checks before gen runs.
- `FeatureFlagsOptions` is a `Schema` that registers `FEATURE_FLAGS_CONFIG_SCHEMA`, which the barrel re-exports as
  `FeatureFlagsConfig$`. `FeatureFlagsConfig` is `Config({ schema })` in `src/config/`, with the derived key
  `feature_flags`. It has no env map, because the PostHog key's variable name differs per target.
- `FlagReader extends Service`. Its constructor takes `FeatureFlagsConfig` and `FlagProvider`. `load(subjects)` picks
  `subjects[targeting]` and sends the tenant as the group. A load ticket makes sure only the newest load is applied,
  and a rejected load keeps the last values. `watch` combines `load` with `setInterval(refreshEvery)`. `subscribe`
  takes the shape `useSyncExternalStore` needs, and the protected `publish` sets the values.
- The drivers: `ConfigFlagProviderDriver` returns `config.values`. `PosthogFlagProviderDriver` sends
  `POST <host>/flags/?v=2`. It returns `{}` for a `null` subject, maps the first `-` back to `.`, and ignores any entry
  whose `enabled` is not a boolean.
- `useFlag` resolves `FlagReader` from `useContainer()` and reads it with `useSyncExternalStore`.
- `FlagsFake extends FlagReader` over the default configuration and a provider that answers with the values set so
  far. `set(ref, value)` publishes synchronously. `fakeFlags(configure)` builds a fake, passes it to `configure` and
  returns it.

## Constitution check

- Boundaries: runtime imports are `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`,
  `zod` and `react` (peer) only. No app, service, `encore.dev` or vendor SDK. The `./testing` entry imports `.` and
  `./contracts` only.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1. Files are `<name>.<kind>.ts`; the drivers are named `<Name>FlagProviderDriver`; codes are snake_case;
  the kind is called only.
- Secrets: none.
- No parameter properties and no `#private` fields (erasable syntax).
