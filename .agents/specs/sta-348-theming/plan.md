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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/state/theming`; workspace imports: `@stackra/assets`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/storage`, `@stackra/tokens`, `@stackra/ui`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                                                       |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                                                                                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                                                                                              |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                                                                            |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                                                    |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                                                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                                                 |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                                                                         |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                                                           |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                                                   |

- Boundaries: imports `@stackra/*` packages' public entries and `zod`, `react`, `react-native` only; no app, service
  or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; no tenant vocabulary beyond the config flag that
  the template names.
- Secrets: none.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./browser`, `./react`, `./native` and `./testing`, and `src/contracts/` imports no other entry — Validates: FR-001
- **P-002**: `.` exports `ColorScheme` (re-exported from `@stackra/ui/contracts`, not declared here), `ThemingConfig`, `ThemingConfig$`, `ThemingOptions`, `ColorSchemeService`, `MemorySystemColorSchemeDriver` and the types `ColorSchemeState`, `SchemeColors` and `Splash` — Validates: FR-002
- **P-003**: `useColorScheme()` from `./react` returns `{ scheme, resolved, setScheme }` and imports no platform module, so the native app uses the same hook — Validates: FR-003
- **P-004**: `ColorSchemeService` reads the choice from the `prefs` area of `@stackra/storage` under `theming.scheme` on every access, not from a cached copy — Validates: FR-004
- **P-005**: no file writes to the DOM or to `Appearance`; applying the scheme is the job of `DesignSystemProvider` in `@stackra/ui` — Validates: FR-005
- **P-006**: the package ships the `theming::enums.color_scheme.*` labels in English and in Arabic — Validates: FR-006
