# Feature Specification: Settings field types, Choice and List, section scopes, one class per group, the settings manifest section

**Feature Branch**: `figentra/sta-2056-settings-field-types`

**Created**: 2026-11-03

**Status**: Planned

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2056

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Work package wp-15 of the gen coverage path. It closes three audit gaps:

- **G-160**: gen drops a settings field whose type it cannot map. There is no `settings_unsupported_type`, no `Choice`
  and no `List`, and nothing checks section scopes or the one-class rule. A class stem other than the module key
  splits the gen key from the runtime key.
- **G-55**: `settings_group_conflict` does not exist, although ADR 0496 lists it as built.
- **G-41** (the settings part): the manifest has no settings section, so setting keys are neither recorded nor locked.

Evidence: `packages/developer/gen/src/core/functions/emit-settings.function.ts:35-43,80-89,147-151` and
`packages/state/settings/src/core/functions/settings-key-of.function.ts:38-41`.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/gen (the owner of this spec); packages/state/settings (`SettingType`,
  `SettingKeyInput`, `SettingValue`, `isSettingValue`, the two `SettingsForm`s, and a comment in `settingsKeyOf`);
  the committed `stackra.manifest.json` of packages/commerce/loyalty-kit, packages/data/search, packages/state/query
  and packages/state/settings, which gain a `settings` section when gen runs
- **Public contract change**: additive. `SettingType` gains `choice` and `list`, `SettingKeyInput` gains `options`, and
  `SettingValue` gains `readonly string[]`. The manifest gains a `settings` section. One behaviour changes: an enum
  field's key is now `choice` with its `options` instead of `string`. No member in this repository emits a key from
  an enum field today; `AccountSettings.locale` is the only enum setting field, and its package emits no keys for
  itself.
- **Cross-service events**: none
- **Tenancy and data**: none. No table or migration changes. A stored value of a new `list` key is a JSON array in the
  existing `stored_settings` value column.
- **Security and privacy**: none. No new input reaches a server; `isSettingValue` gets stricter (choice membership,
  list elements).
- **Secrets**: none
- **ADR needed**: no. This implements ADR 0496 decisions 7 and 9 and its Enforcement list, ADR 0307 rules 22 and 23,
  and ADR 0294 decisions 5, 20 and 22 as written.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: the web and native `SettingsForm` of `@stackra/settings` edit a `choice` key as text and a `list`
  key as comma-separated text. The proper controls belong to `@stackra/settings-ui` (ADR 0496 decision 4).
- **Docs to update**: packages/developer/gen/README.md (the settings keys bullet), packages/state/settings/README.md
  (`SettingType`); no apps/docs page lists these codes yet (wp-22 owns the gen codes page)
- **Lane**: full
- **Change risk**: R2 (a committed contract every host reads gains a section, and a shared runtime type widens)

## Glossary _(full lane)_

- **Group key**: the key a settings class's values are stored and read under (`orders`, `loyalty_kit`, `account`).
  The runtime derives it from the class name: `PascalCase(group) + "Settings"`.
- **Setting key**: one setting field, with its path in the group (`cancellation.windowDays`) and its full path
  (`orders.cancellation.windowDays`).
- **Section**: a settings field typed as a schema class. Its fields become keys under the section's name.
- **Host override**: a class in `src/overrides/<owner>/` that keeps its package base's name (ADR 0306). Its
  `ShapeIR.base` is `{ kind: "package" }`.
- **Enclosing scopes**: the scopes a `@Setting({ scopes })` must narrow. For a field of the class or a section field,
  they are the class's scopes. For a section's inner field, they are the section field's scopes, or the class's when
  the section field gives none.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An author's settings field is never dropped silently (Priority: P1)

An author adds a field to `orders.settings.ts`. If gen can map its type, the field gets a key: a closed enum becomes a
`choice` and a string array becomes a `list`. If gen cannot map it, gen stops with `settings_unsupported_type`, which
names the field and the types it accepts.

**Why this priority**: a dropped field looks like a working setting in code, but it has no key, no page row and no
stored value. That fails silently.

**Independent Test**: `emitSettings` and `settingsOf` over an IR with a `json`, a `money`, an enum and a `string[]`
field.

**Acceptance Scenarios**:

1. **Given** a settings class with a `json` field, **When** gen runs, **Then** it refuses with
   `settings_unsupported_type` on `OrdersSettings.extras` and writes no file.
2. **Given** an enum field `mode: OrderMode`, **When** gen runs, **Then** the key is
   `{ type: "choice", options: ["open", "closed"], ... }`.
3. **Given** a field `tags: string[]`, **When** gen runs, **Then** the key is `{ type: "list", ... }`. Given
   `modes: OrderMode[]`, the key is `{ type: "list", options: [...] }`.

---

### User Story 2 - Gen and the runtime agree on every group key (Priority: P1)

`AccountSettings` lives in the settings package, whose module key is `settings`. The runtime reads its group as
`account`, but gen writes `Settings.settings.locale`. After this change, gen derives the group key from the class name
with the runtime's own rule. One owner per group key holds within the member and across its dependencies.

**Why this priority**: ADR 0496 moves `account` to identity and gives theming three groups. A split key means the
written keys never reach the reader.

**Independent Test**: the gen `settingsKeyOf` cases mirror the runtime's test cases. `settingsOf` over two classes
that derive one key refuses `settings_group_conflict`.

**Acceptance Scenarios**:

1. **Given** `AccountSettings` in a module keyed `settings`, **When** gen runs, **Then** `#stackra/settings` has
   `Settings.account.locale`, and its label is `settings::settings.account.locale.label`.
2. **Given** `OrdersSettings` and `OrdersPolicySettings` in one member, **Then** the two keys differ (`orders`,
   `orders_policy`), and no conflict is raised.
3. **Given** `OrdersSettings` in two modules of one member, **When** gen runs, **Then** it refuses with
   `settings_group_conflict`, and the error names both files.
4. **Given** a member that declares `AccountSettings` and depends on a package whose manifest records the group
   `account`, **When** gen runs, **Then** it refuses with `settings_group_conflict`, unless the member's class is a
   host override of that package's class.

---

### User Story 3 - A scope a field cannot have is refused (Priority: P2)

`@Setting({ scopes })` narrows. A field or section that lists a scope outside its enclosing scopes is refused with
`settings_scope_widened`.

**Why this priority**: the runtime would offer a level the class does not allow.

**Independent Test**: `settingsOf` over a class with scopes `[platform]` and a field with `@Setting({ scopes:
["platform", "user"] })`.

**Acceptance Scenarios**:

1. **Given** class scopes `["platform", "tenant"]` and a section field narrowed to `["platform"]`, **When** an inner
   field of that section declares `["tenant"]`, **Then** gen refuses with `settings_scope_widened` on
   `CancellationSection.windowDays`.

---

### User Story 4 - The manifest records and locks every setting key (Priority: P2)

The manifest gains a `settings` section with each group, its class and its keys. A class rename that changes the
group key, or a field rename, fails `stackra gen --check` unless `@Renamed(old)` names the locked identity.

**Why this priority**: stored rows are keyed by group and path, so a silent rename orphans every stored value.

**Independent Test**: `checkIdentityLock` over a locked manifest and a derived one.

**Acceptance Scenarios**:

1. **Given** the locked key `orders.note` and a derived group that lost `note` and gained `memo` with no
   `@Renamed("note")`, **When** gen runs against the committed manifest, **Then** it refuses with `identity_changed`
   on `OrdersSettings.memo`.
2. **Given** the same rename with `@Renamed("note")` on `memo`, **Then** nothing is refused.
3. **Given** a locked key that is removed while no key is added, **Then** nothing is refused. The
   backward-compatibility test reports the removal, as it does for a removed class.

### Edge Cases

- **EC-01**: A settings class's scopes are not constant (`TenancyScopes.Tenant` read as unknown). The scope check
  skips any pair in which either side is not an array of strings, and the key keeps the current behaviour (the value
  is left out, so the typecheck names it).
- **EC-02**: A section's field is itself a schema. Gen refuses it with `settings_too_deep` (ADR 0307 rule 22) instead
  of dropping it. wp-73 keeps `rules(r)` and `secret_in_settings`.
- **EC-03**: A `PublicId` field whose prefix is not `conn` is `settings_unsupported_type`. Only a connection id is a
  setting (ADR 0307 rule 23).
- **EC-04**: A nullable enum is `choice` with `nullable: true`. An optional field maps as its type does.
- **EC-05**: A host override shape (`base.kind === "package"`) keeps its base's group key. It is neither a conflict
  with the base package's manifest entry nor a new manifest entry: the base package locks it.
- **EC-06**: A class whose name derives an empty key (one named only `Settings`) is refused with
  `settings_group_key_empty`, because the runtime throws for it.
- **EC-07**: An array of a type other than `string`, a brand or an enum (`number[]`, `Schema[]`) is
  `settings_unsupported_type`.
- **EC-08**: A member with no settings class writes no `settings` section, so existing manifests do not change.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE gen `settingsKeyOf(className)` SHALL derive a group key with the runtime rule: drop a trailing
  `Settings`, then convert to snake_case (`LoyaltyKitSettings` gives `loyalty_kit`). `emitSettings`, `checkApproval`,
  the `Settings.pick` reader and the manifest SHALL key settings by it, not by the module key.
- **FR-002**: IF a setting field's type maps to no `SettingType` THEN gen SHALL refuse with
  `settings_unsupported_type` (file, `Class.field`, the type, and the accepted types as the fix) and write no file.
- **FR-003**: WHEN a setting field is an enum or a `DriverName<Port>` THE emitted key SHALL be
  `{ type: "choice", options: [<values in declaration order>] }`.
- **FR-004**: WHEN a setting field is an array of `string` or a brand THE key SHALL be `{ type: "list" }`, and WHEN it
  is an array of an enum THE key SHALL be `{ type: "list", options: [...] }`.
- **FR-005**: THE settings runtime SHALL accept the new keys. `SettingType` gains `Choice` (`choice`) and `List`
  (`list`), `SettingKeyInput` gains `options?: readonly string[]`, and `SettingValue` gains `readonly string[]`.
  `isSettingValue` SHALL accept a choice only when it is in `options`, and a list only as an array of strings, each
  in `options` when options are given.
- **FR-006** (example-only): THE web and native `SettingsForm` SHALL edit a `choice` key as text and a `list` key as comma-separated
  text until `@stackra/settings-ui` ships the controls.
- **FR-007**: IF `@Setting({ scopes })` on a field, a section field, or a section's inner field lists a scope outside
  its enclosing scopes THEN gen SHALL refuse with `settings_scope_widened`.
- **FR-008**: IF two settings classes of one member derive the same group key THEN gen SHALL refuse with
  `settings_group_conflict`, naming both classes and files.
- **FR-009**: IF a group key the member declares (not a host override) is also recorded in a dependency manifest's
  `settings` section, or two dependency manifests record the same group key, THEN gen SHALL refuse with
  `settings_group_conflict`.
- **FR-010**: THE manifest SHALL carry `settings` when the member has a settings class of its own. It has one entry
  per class, `{ key, class, module, file, keys: [{ path, type, options?, renamed? }] }`, in group-key order, and it
  is written in the manifest pass too.
- **FR-011**: WHEN the committed manifest locks a settings entry THE identity lock SHALL refuse a changed group key for
  the same class with `identity_changed`, unless the class carries `@Renamed(<old key>)`.
- **FR-012**: WHEN a locked group lost a key path and gained one or more paths, none of which lists the lost path in
  `renamed`, THE identity lock SHALL refuse with `identity_changed` on the gained field, with the fix
  `@Renamed("<old>")`. A removal with no gained path SHALL pass.
- **FR-013**: THE label key SHALL stay `<module>::settings.<section.>name.label` when the group key equals the
  declaring module key. Otherwise it SHALL be `<module>::settings.<group>.<section.>name.label`, so that two groups
  of one module never share a label.
- **FR-014**: IF a section's field is itself a schema THEN gen SHALL refuse with `settings_too_deep`. IF a class's
  derived group key is empty THEN gen SHALL refuse with `settings_group_key_empty`.

### Key Entities

- **Settings manifest entry**: one settings class of the member: its group key, class, module, file and keys. Each key
  has its path in the group, its `SettingType` code, its options for a choice or a constrained list, and its earlier
  paths (`renamed`).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: IF a setting field has a type gen cannot map THEN THE gen SHALL refuse with `settings_unsupported_type` instead of dropping the field.
- **AC-002**: WHEN a setting field is an enum, or an array of strings or enum values, THE generated `#stackra/settings` SHALL hold a `choice` or `list` key that `settingKeys` and `isSettingValue` accept.
- **AC-003**: IF two settings classes declare one group key, in the member or across its dependencies, THEN THE gen SHALL refuse with `settings_group_conflict`.
- **AC-004**: WHEN a settings class's stem is not its module key THE gen group key SHALL equal the runtime `settingsKeyOf` key.
- **AC-005**: THE manifest SHALL record each settings group and its keys, and the identity lock SHALL refuse a group or key rename that has no `@Renamed`.
- **AC-006**: IF a `@Setting({ scopes })` widens its enclosing scopes THEN THE gen SHALL refuse with `settings_scope_widened`.

## Success Criteria _(mandatory)_

- **SC-001**: No settings field of any member is dropped. Every field either gets a key or is refused. Verified by:
  unit (`emit-settings.function.test.ts`, `settings-of.function.test.ts`).
- **SC-002**: The gen and runtime group keys are the same for every case of the runtime test. Verified by: unit
  (`settings-key-of.function.test.ts` in gen, mirroring the runtime's cases).
- **SC-003**: `stackra gen --check` passes on every member after the four committed package manifests are
  regenerated. Verified by: the ci-box gen and check run.

## Out of scope

- The `@stackra/settings-ui` select, multi-select and option-source controls, and the `control` hint (ADR 0496
  decision 9, second half).
- Dynamic option sources (`theming.presets`): this ships a closed `options` list only.
- `rules(r)` compilation, `secret_in_settings` (wp-73), and the generated `settings.update` action (wp-74).
- Moving `@stackra/settings` to `packages/foundation` (ADR 0496 decision 1) and moving `AccountSettings` to identity.
- A settings type change through the settings migrator (ADR 0307 rule 23).

## Assumptions

- The group key is the class stem, not the module key. ADR 0496 decisions 5 and 6 give one module several groups
  (theming owns `appearance`, `motion` and `accessibility`), and keep `account` while its class moves between
  packages. The runtime already derives the key from the class name.
- The current label keys stay unchanged where the group equals the module, which is every group in this repository
  except `account`. No lang file carries an `account` label yet.
- A key rename is told apart from a removal only by an added key in the same group (FR-012). A removal together with
  an unrelated addition in one change is refused until the author adds `@Renamed` or splits the change. This is the
  safe reading, because stored rows are keyed by path.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · claude (gen-100 wp-15) · created from the gen coverage audit (G-160, G-55, G-41 settings)
- 2026-11-03 · Draft → Clarified · claude (gen-100 wp-15) · every question answered from ADR 0496, 0307, 0294 and the
  code; none left for the owner
- 2026-11-03 · Clarified → Planned · claude (gen-100 wp-15) · plan written
