# Plan: `@stackra/shortcuts` wave 3

**Spec**: `.agents/specs/sta-348-shortcuts/spec.md`

## Design

- `Shortcut` is `createKind("shortcut", ShortcutBase, readShortcutOptions)`, cast so it can only be called.
  `readShortcutOptions` normalises `keys` (`normalizeShortcutKeys`), refuses an empty `group`, and records
  `{ keys | null, group, icon | null, intents }` for `kindOf`. `run` is not on the instance type, so authors write no
  `override`; runners take `RunnableShortcut`.
- Normal form: lower case, modifiers in `MODIFIERS` order (`mod ctrl alt shift meta`), one key from `KEY_NAMES` or a
  single printable character, chord steps separated by one space.
- `findShortcutConflicts` resolves `mod` to `meta` (Apple) and `ctrl` (elsewhere), compares each pair's steps, and
  reports `same` or `prefix` once per pair.
- `registerShortcuts([[Class, key, label]])` (the wiring's call, like `registerStores`) validates key and label forms,
  the kind and `run`, a taken key, then the conflicts over everything registered; all or nothing.
- `ShortcutContext` is an empty open interface. `contributeShortcutContext(part)` adds a function read per run;
  `createShortcutContext` merges the parts.
- `./react`: `useShortcuts` maps `SHORTCUT_ENTRIES` the container binds to `ShortcutItem`; `useShortcut` and
  `useRunShortcut` resolve from `useContainer()` and run with `createShortcutContext()`; `ShortcutKeys` formats with
  `formatShortcutKeys` and `isApplePlatform` read through `useSyncExternalStore` (server snapshot non-Apple);
  `ShortcutBindings` registers TanStack Hotkeys' `getHotkeyManager()` and `getSequenceManager()` (timeout
  `CHORD_TIMEOUT`) in an effect and unregisters on cleanup.
- `./testing`: `runShortcut` calls every registered `ShortcutTestingPart` with `{ type, input }`, takes the first
  instance, merges the context members, passes unclaimed input as given, falls back to `new type()`, runs once and
  returns `{ ...context, shortcut }`. `ShortcutRun` is open for the parts' extra members.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/shortcuts`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/icons` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                             |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                           |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                    |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                  |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                          |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                       |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                               |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                 |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                              |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                         |

- Boundaries: runtime imports are `@stackra/contracts`, `@stackra/container`, `@stackra/icons` (types),
  `@tanstack/hotkeys` (only in `src/react/shortcut-bindings/`) and `react` (peer). No app, service, `encore.dev`, and no
  other package's `./testing`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; codes snake_case; the kind is called only; no `kbd`.
- Secrets: none. No parameter properties and no `#private` fields (erasable syntax).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./react` and `./testing` — Validates: FR-001
- **P-002**: every template import resolves: `.` exports `Shortcut` (called with `{ keys?, group }`) and the type `ShortcutContext`, `./react` exports `ShortcutItem`, `ShortcutKeys`, `useRunShortcut`, `useShortcut` and `useShortcuts`, and `./testing` exports `runShortcut(Class, input?)` — Validates: FR-002
- **P-003**: `findShortcutConflicts` reports shortcuts that share a key sequence, a chord sequence is abandoned after 1.5 s, and TanStack Hotkeys is imported from `./react` only — Validates: FR-003
- **P-004**: `ShortcutContext` and `ShortcutRun` accept declaration merging, their values come from `contributeShortcutContext` and `registerShortcutTestingPart`, and no file imports navigation, theming or identity code — Validates: FR-004
