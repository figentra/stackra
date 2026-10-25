# Plan: `@stackra/settings` wave 5

**Spec**: `.agents/specs/sta-348-settings/spec.md`

## Design

- Five entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  `SettingValueStore` port and its types), `.` from `src/core/`, `./node` from `src/node/` (the module groups
  `models/`, `services/`, `drivers/`, `database/migrations/`), `./native` from `src/native/`, `./testing` from
  `src/testing/`. No `./react`: the web form is not imported by the template.
- `Settings` is `createKind("settings", SettingsBase, read)`; the base holds a protected type-only brand and the default
  `rules(r)` (no rule), so a settings class's fields are exactly its declared ones. `settings` is already one of
  validation's shape kinds, so `@Int`, `@Str` and `@Renamed` mark its fields.
- `@Setting` is `createDecorator` with kinds `settings` and `schema` (a section is a schema class), read back with
  `Setting.members(Class)` as `@Int` and `@Secret` are; no Explorer, because settings classes are not bindings.
- `SettingsReader` is a service over the `SettingValueStore` port: `get` derives the group key from the class name,
  merges the layers, nests `section.field` paths and returns `validate(Class, nested)`'s instance; `read` and `write`
  serve a page (the form). The lock check is the store's, through one shared core function.
- `settingKeys` records each module's keys in a module-level map that `settingsPage` reads eagerly, so a page carries
  its own fields; `pick` derives a schema class that records its key paths, compiled by gen like `PickType`.
- `StoredSetting` (one row per group and holder, `values` and `locked` as `jsonb`) with `StoredSettingService`, whose
  raw `ltree` read uses the session's `app.scope_path` or an explicit path; `PostgresSettingValueStoreDriver` maps rows
  to layers.
- `SettingsFake` extends `SettingsReader` over a seeded `MemorySettingValueStoreDriver` and records page writes.

## Constitution Check

| Law                                   | Result | Note                                                                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/state/settings`; imports only `tier:lib` packages; no app, service or `encore.dev`                |
| Secrets (ADR 0173)                    | PASS   | no secret is read or stored; `@Secret` cannot mark a settings class, and gen refuses `secret_in_settings`                 |
| Security                              | PASS   | reads stay on the node's ancestor chain; writes name their holder; a lock above refuses; the table policy is an open item |
| HTTP and events                       | N/A    | no endpoint or event here; gen writes the settings operations                                                             |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); levels are data (ADR 0327 d2); the missing policy is listed for the owner                    |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer    |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; no JSONB-for-everything store (one typed group per row, ADR 0327 d9)                  |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                 |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                         |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                                 |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0307 stands, the open items are listed in the spec                          |

- Boundaries: runtime imports of container, contracts, database, errors, i18n, icons, model, ui and validation;
  dev-only `@stackra/config`, `@stackra/testing`, the tooling presets, zod and the React test libraries.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, the service `StoredSettingService`, refusals end in `Error`, no `define` prefix.

## Properties

- **P-001**: `package.json` names `@stackra/settings` at `packages/state/settings` and `exports` lists only `.`, `./contracts`, `./node`, `./native` and `./testing` — Validates: FR-001
- **P-002**: for every settings class, `kindOf(Class)` records its scopes frozen and its navigation or `null`, an empty or repeated scope list refuses, and `keyof Fields<Class>` is its declared fields — Validates: FR-002
- **P-003**: `Setting.members(Class)` returns each decorated field's options, and a scope outside the class's refuses at declaration — Validates: FR-003
- **P-004**: `Enum.values(SettingScope)` is `["platform", "product", "node", "user"]` — Validates: FR-004
- **P-005**: for every layer list, `get` returns the first locked value of each key, else the innermost value, else the schema default — Validates: FR-005
- **P-006**: each driver refuses `settings_locked` for exactly the written keys some holder above the target locks — Validates: FR-006
- **P-007**: every key's `path` is `<module>.<section>.<name>` or `<module>.<name>`, and `settingsPage(module).fields` are that module's keys — Validates: FR-007
- **P-008**: `write` stores nothing when any value breaks its key and lists every bad key in the field errors — Validates: FR-008
- **P-009**: a toggled switch writes `{ <name>: value }` at the page scope, and a locked key renders read-only — Validates: FR-009
- **P-010**: `fakeSettings([[Class, patch]]).get(Class)` equals the schema's parse of the patch, and `writes` lists each page write — Validates: FR-010
- **P-011**: `grep -ri tenant packages/state/settings/src` finds nothing — Validates: FR-011

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | the same build; the Postgres driver on the server, the client driver per app |
| On-prem    | identical: the same build, no SaaS-only code path                            |
| Air-gapped | identical: needs no network; values live in the deployment's own Postgres    |
