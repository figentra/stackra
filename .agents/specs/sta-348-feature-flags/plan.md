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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                   |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/state/feature-flags`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | `posthogKey` reaches the package through the config class and never from code                                                                                                                          |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                                  |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                           |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                         |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                 |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                |

- Boundaries: runtime imports are `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`,
  `zod` and `react` (peer) only. No app, service, `encore.dev` or vendor SDK. The `./testing` entry imports `.` and
  `./contracts` only.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1. Files are `<name>.<kind>.ts`; the drivers are named `<Name>FlagProviderDriver`; codes are snake_case;
  the kind is called only.
- Secrets: none.
- No parameter properties and no `#private` fields (erasable syntax).

## Deploy modes

| Mode       | Behaviour                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                                                                                               |
| On-prem    | identical: the same build, no SaaS-only code path                                                                                                              |
| Air-gapped | identical: the config provider needs no network; the PostHog driver is opt-in and configured by the consumer, so the package makes no call unless it is chosen |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react` and `./testing` — Validates: FR-001
- **P-002**: every template import resolves: `.` exports `Flag`, `FeatureFlagsConfig`, `FlagTargeting`, `flagRefs`, `ConfigFlagProviderDriver` and `PosthogFlagProviderDriver`, `./contracts` exports `FlagProvider` with `DriverName<FlagProvider>` equal to `"config" | "posthog"`, `./react` exports `useFlag`, and `./testing` exports `fakeFlags` — Validates: FR-002
- **P-003**: `.` also exports `FeatureFlagsConfig$` (the shipped schema) and `FlagReader` — Validates: FR-003
- **P-004**: `FeatureFlagsConfig` has the fields `provider`, `values`, `targeting`, `refreshEvery`, `posthogKey` and `posthogHost`, and `posthogKey` is fed by the template env's `featureFlagsPosthogKey` — Validates: FR-004
- **P-005**: a flag read for an anonymous caller sends no identifier out of the process — Validates: FR-005
