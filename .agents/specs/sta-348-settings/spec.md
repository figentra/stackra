# Feature Specification: `@stackra/settings` wave 5, scoped runtime settings

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/settings` (state, wave 5, data gate lifted): the `Settings({ scopes, navigation })` kind,
the `@Setting` field decorator, `SettingsReader#get(Class)` resolving a group through the scope cascade, sections one
level deep, never a secret, the generated-key helpers (`settingKeys`, `settingsPage`), the native `SettingsForm` and
`fakeSettings` (ADR 0307 rules 22 to 24, ADR 0213, ADR 0327).

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's apps, services and loyalty kit adopt it once converted, STA-344)
- **Packages touched**: `packages/state/settings` (new member)
- **Cross-service events**: none
- **Tenancy and data**: one table, `settings.stored_settings`, one row per group and holder (a scope node or a user);
  read along the node's ancestor chain, so it carries no subtree row-level-security policy (see open items); no tenant
  vocabulary (R-59, ADR 0323)
- **Secrets**: none; a setting is never a secret (ADR 0307 rule 23)
- **ADR needed**: no (ADR 0307, 0213, 0108, 0323 and 0327 decide the package)
- **New dependencies**: none outside the workspace and the catalogs; runtime edges to container, contracts, database,
  errors, i18n, icons, model, ui and validation
- **Deploy modes**: same code in all; the store is a port with a memory and a Postgres driver
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/state/settings/README.md`, `packages/state/settings/AGENTS.md`; ADR 0307, 0213 and 0327 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public kind and reader every module's settings resolve through)

## Clarifications

### Session 2026-10-24

The package follows ADR 0307 rules 22 to 24, the v3.1 registry row and the owner decisions of 2026-10-24
(programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24 (R-59, ADR 0323 d4, ADR 0327 d2): scope levels are data; settings ships `SettingScope` with
  `Platform`, `Product`, `Node` and `User`, and tenancy contributes its level as `TenancyScopes.Tenant`. A `scopes` list
  takes any level key (`SettingLevel`), so a contributed level type-checks without a settings-owned tenant case
- The group key is derived from the class name (`OrdersSettings` → `orders`), as `configKey` derives a configuration's
  key; a host override keeps the name and the key
- `SettingsRules<T>` is a type: gen reads the calls of `rules(r)` from the syntax tree and compiles them into the
  group's schema; the closed set is `lessThan`, `atMost`, `greaterThan` and `atLeast` on number paths
- Values are resolved root first along the node's path, then the user's; a lock at a holder pins the value for every
  holder below it; the resolved group is parsed by the class's generated schema (defaults, bounds, sections, rules)
- The registry row's `config` edge is not needed at runtime: settings are runtime values per scope, config is
  deployment values (the tests import `@stackra/config` only to prove `@Secret` cannot mark a settings class)

## User Scenarios & Testing

### User Story 1 - Declare a module's settings (Priority: P1)

A module writes `class OrdersSettings extends Settings({ scopes, navigation })` with `@Setting` on the fields that
narrow it and a section typed by a schema class.

**Independent Test**: `src/core/bases/__tests__/settings.base.test.ts`, `src/core/decorators/__tests__/setting.decorator.test.ts`.

**Acceptance Scenarios**:

1. **Given** a settings class, **When** it is declared, **Then** its scopes and navigation are recorded for gen.
2. **Given** `@Setting({ scopes })` naming a scope the class does not hold, **When** the class is declared, **Then** it
   is refused at import.
3. **Given** `@Secret` on a settings field, **When** the class is declared, **Then** it is refused.

### User Story 2 - Read a resolved group (Priority: P1)

A handler calls `await this.settings.get(OrdersSettings)` and reads defaults, platform values and the tenant's
overrides, with locks applied.

**Independent Test**: `src/core/services/__tests__/settings-reader.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** no stored value, **When** the group is read, **Then** every field holds its default and each section its
   section defaults.
2. **Given** a platform value locked and a tenant value for the same key, **When** the group is read, **Then** the
   platform value wins.
3. **Given** a user's value, **When** the group is read with `{ user }`, **Then** the user's value wins.

### User Story 3 - Edit a page on mobile (Priority: P2)

The app renders `<SettingsForm page={SettingsPages.messages} />`; a toggle writes the user's value at the page scope.

**Independent Test**: `src/native/settings-form/__tests__/settings-form.test.tsx`.

### User Story 4 - Fake settings in a test (Priority: P1)

A test overrides `SettingsReader` with `fakeSettings([[OrdersSettings, { acceptingOrders: false }]])` and asserts the
form's `writes`.

**Independent Test**: `src/testing/functions/__tests__/fake-settings.function.test.ts`.

### Edge Cases

- A write to a key a holder above locked: refused `settings_locked`, the stored value untouched.
- A value that breaks its key's type or bounds: refused `setting_value_invalid` with a field error per key.
- A read outside every scope session on the server: only defaults and the user's values apply.
- A stored value that breaks a later schema: the read throws; a type change goes through the settings migrator.

## Requirements

- **FR-001**: The package SHALL be `@stackra/settings` at `packages/state/settings`, `tier:lib`, entries `.`,
  `./contracts`, `./node`, `./native` and `./testing` only.
- **FR-002**: `Settings({ scopes, navigation })` SHALL be a called-only kind base recording a non-empty, duplicate-free
  scope list and the optional navigation; its instances carry no data field of their own, so `Fields<X>` is the
  declared fields.
- **FR-003**: `@Setting({ scopes, lockable, approval, client })` SHALL be a field decorator on settings and schema
  classes that refuses an empty scope list and, on a settings class, a scope outside the class's.
- **FR-004**: `SettingScope` SHALL hold `platform`, `product`, `node` and `user`, and no tenant case.
- **FR-005**: `SettingsReader#get(Class, { user, scope })` SHALL merge the stored layers root first, keep a locked
  value against every holder below it, nest sections one level deep and parse the result with the class's schema.
- **FR-006**: `SettingValueStore` SHALL be a port in `src/contracts/` with a memory driver in `.` and a Postgres driver
  in `./node`, both refusing `settings_locked` for a key a holder above the target locked.
- **FR-007**: `settingKeys(tree)` SHALL return typed keys with their full `path` and a `pick(keys)` shape class;
  `settingsPage(key, { scope, panels })` SHALL carry the module's keys.
- **FR-008**: `SettingsReader#write(page, values, target)` SHALL refuse `setting_value_invalid` for an unknown key or a
  value that breaks its key's type, nullability or bounds.
- **FR-009**: `SettingsForm` SHALL render a page's keys with `@stackra/ui/native` fields, show a locked key read-only
  and write each change through the reader.
- **FR-010**: `fakeSettings(entries)` SHALL be a `SettingsReader` over seeded values that records each form write as
  `{ page, scope, values }`.
- **FR-011**: No identifier, comment or default in the package SHALL carry tenant vocabulary.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- `settings.stored_settings` has no row-level-security policy: the only generated policies are equality and subtree
  (`ancestor`), and the cascade must read the rows above a node, which the subtree policy hides. Reads filter to the
  node's ancestor chain (`scope_path @> path`, from `Database.withScope` or an explicit `ScopeRef`); writes name their
  holder. A policy that shows the ancestor chain needs a third match mode in `@stackra/database`.
- `@Renamed` on a settings field is recorded for gen; the reader does not move a value stored under an old name,
  because it cannot see a section's class at run time (gen's settings migrator, or a generated `[Class, sections]`
  registration, closes it).
- `approval`, `client` and per-field `scopes` are recorded metadata; the generated settings operations enforce them
  (approval queue, area bootstrap, write scope). The cross-field rules run in the class schema gen compiles.
- `ConnectionRef<C>` (ADR 0307 r23) is not exported by `@stackra/integrations`; settings ships `SettingType.Connection`
  for a key that holds a connection id and leaves the typed reference to that package.
- The client `SettingValueStore` driver (calling the generated settings actions) lands with `@stackra/clients`' settings
  surface; `SettingsForm` reads and writes through whatever driver the app binds.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
