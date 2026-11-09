# Implementation Plan: Settings field types, Choice and List, section scopes, one class per group, the settings manifest section

**Spec**: `.agents/specs/sta-2056-settings-field-types/spec.md` · **Linear**: STA-2056 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2056-settings-field-types/spec.md`

## Summary

A new pure gen function, `settingsOf(ir)`, reads every settings class once. It derives each class's group key with a
new gen `settingsKeyOf`, which uses the runtime's rule, and maps each field to a `SettingType` (adding `choice` and
`list`). It refuses unmappable fields, widened scopes, too-deep sections, empty keys and group conflicts, and returns
the manifest's `settings` entries. `buildManifest` records those entries. `emitSettings`, `checkApproval` and the
`Settings.pick` reader key groups by the derived key. `checkIdentityLock` locks the group key per class and the key
paths per group. In `@stackra/settings`, `SettingType` gains `Choice` and `List`, `SettingKeyInput` gains `options`,
`SettingValue` gains `readonly string[]`, and `isSettingValue` and the two forms learn the new types.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/state/settings` (`tier:lib`); committed manifests of
  `packages/commerce/loyalty-kit`, `packages/data/search`, `packages/state/query` and `packages/state/settings`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), run on ci-box
- **Storage**: none
- **Runtime target**: a library (gen-core is pure and isomorphic)

## Constitution Check

| Law                                   | Result | Note                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | gen copies the 3-line key rule rather than importing `@stackra/settings` |
| Secrets (ADR 0009)                    | PASS   | none touched                                                             |
| Security                              | PASS   | `isSettingValue` only gets stricter                                      |
| HTTP and events                       | N/A    | no action, query, endpoint or event changes                              |
| Tenancy                               | N/A    | no tenant-owned table changes                                            |
| Delegation                            | PASS   | one session, one PR                                                      |
| Not built yet (ADR 0011)              | PASS   | nothing from the rejected or deferred table                              |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                            |
| Versions and catalogs                 | PASS   | no dependency or catalog change, no lockfile change                      |
| Deploy modes (ADR 0076)               | PASS   | build-time and pure runtime code; same in all three                      |
| Licence tier (ADR 0077)               | PASS   | free code in this repository                                             |
| Docs and ADRs                         | PASS   | implements ADR 0496, 0307 and 0294 as written; two READMEs updated       |

## Deploy modes

| Mode       | Behaviour                                                       |
| ---------- | --------------------------------------------------------------- |
| SaaS       | same: gen output and the settings runtime have no outbound call |
| On-prem    | same                                                            |
| Air-gapped | same                                                            |

## Correctness properties

- **P-001**: For every class name, the gen `settingsKeyOf` equals the runtime `settingsKeyOf` of a class with that name. — Validates: FR-001
- **P-002**: Every settings field yields exactly one key or exactly one refusal. None is dropped. — Validates: FR-002, FR-003, FR-004, FR-014
- **P-003**: An emitted `choice` or `list` key, with its default, passes `isSettingValue`. A value outside `options` fails it. — Validates: FR-003, FR-004, FR-005
- **P-004**: A scope set that is a subset of its enclosing set is never refused. One that adds a scope always is. — Validates: FR-007
- **P-005**: No two own classes, and no own class and a dependency entry that is not overridden, share a group key without `settings_group_conflict`. — Validates: FR-008, FR-009
- **P-006**: `checkIdentityLock(m, m)` is empty. A rename without `@Renamed` is refused. The same rename with it, or a plain removal, is not. — Validates: FR-010, FR-011, FR-012
- **P-007**: Label keys of a group whose key equals its module are byte-identical to today's output. — Validates: FR-013

## Architecture overview

```
discovery (MemberIR: shapes kind "settings", classes with @Setting facets, dependencies' manifests)
  └─ settingsOf(ir) ──► { entries, errors }
        ├─ buildManifest: manifest.settings = entries; errors joined (manifest and full passes)
        ├─ emitSettings: groups by entry.key, label rule FR-013, choice/list metadata
        └─ checkApproval: approval keys as <group>.<path>
  checkIdentityLock(previous, next, renames): + settings (class → key) and key paths (field renames read from keys[].renamed)
create-source-reader: Settings.pick resolves Settings.<group>.<name> by settingsKeyOf(class name)
@stackra/settings: SettingType + Choice/List; SettingKeyInput.options; SettingValue + string[]; isSettingValue; forms
```

## Components and responsibilities

- `settingsKeyOf(className)` (gen, new): the runtime's rule as a pure string function, plus the override rule. A shape
  with `base.kind === "package"` keys by `base.name`.
- `settingTypeOf(field)` (gen, new, beside `settingsOf`): maps a `TypeDesc` to `{ type, options? }` or `undefined`.
  It moves `settingType` out of `emitSettings`, so both callers share one mapping.
- `settingsOf(ir)` (gen, new): walks the settings shapes and returns the manifest entries and the refusals
  `settings_unsupported_type`, `settings_scope_widened`, `settings_too_deep`, `settings_group_key_empty` and
  `settings_group_conflict` (own pairs, own against dependencies, dependency against dependency).
- `emitSettings` (changed): uses `settingTypeOf`, keys groups by `settingsKeyOf`, and writes `options`. It returns
  undefined only for no settings or an undeclared `@stackra/settings`. Refusals come from `settingsOf` through the
  manifest, so `generateMember` never reaches the emitter with a bad field.
- `buildManifest` (changed): adds `...(entries.length > 0 ? { settings: entries } : {})` and the errors.
- `checkIdentityLock` (changed): adds `settings: "key"` to `LOCKED`, plus a key-path pass over groups present in both
  manifests that reads `renamed` from the derived keys.
- `checkApproval` (changed): `approvalKeys` keys by the group key.
- `create-source-reader` (changed): `settingFieldsOf(group)` matches classes by `settingsKeyOf(name)`.
- `@stackra/settings` (changed): the enum, the key input type, the value type, `isSettingValue`, both forms' `parse`
  and display, and the `settingsKeyOf` comment ("gen derives the same key from the class name").

## Files and folders

- add `packages/developer/gen/src/core/functions/settings-key-of.function.ts`
- add `packages/developer/gen/src/core/functions/settings-of.function.ts`
- add `packages/developer/gen/src/core/functions/setting-type-of.function.ts`
- add `packages/developer/gen/src/core/functions/__tests__/settings-key-of.function.test.ts`
- add `packages/developer/gen/src/core/functions/__tests__/settings-of.function.test.ts`
- add `packages/developer/gen/src/core/functions/__tests__/setting-type-of.function.test.ts`
- change `packages/developer/gen/src/core/functions/emit-settings.function.ts` and its test
- change `packages/developer/gen/src/core/functions/build-manifest.function.ts` and its test
- change `packages/developer/gen/src/core/functions/check-identity-lock.function.ts` and its test
- change `packages/developer/gen/src/core/functions/check-approval.function.ts` and its test
- change `packages/developer/gen/src/node/functions/create-source-reader.function.ts` and its test
- change `packages/developer/gen/src/core/index.ts` (export the new functions, as the index test lists every export)
- change `packages/state/settings/src/core/enums/setting-type.enum.ts`,
  `packages/state/settings/src/core/types/setting-key-input.type.ts`,
  `packages/state/settings/src/contracts/types/setting-value.type.ts`,
  `packages/state/settings/src/core/functions/is-setting-value.function.ts`,
  `packages/state/settings/src/react/settings-form/settings-form.tsx`,
  `packages/state/settings/src/native/settings-form/settings-form.tsx`,
  `packages/state/settings/src/core/functions/settings-key-of.function.ts` (comment only), with their tests
- regenerate the committed `stackra.manifest.json` of loyalty-kit, search, query and settings
- add `.changeset/settings-field-types.md` (minor for `@stackra/gen` and `@stackra/settings`)
- change `packages/developer/gen/README.md` and `packages/state/settings/README.md`

## Data models and migrations

none. A `list` value is stored as a JSON array in the existing value column. No migration.

## Contracts

- Manifest: new optional section `settings: { key, class, module, file, keys: { path, type, options?, renamed? }[] }[]`.
  `StackraManifest` already allows extra sections through its index signature (its comment names `settings`), so
  `@stackra/contracts` does not change.
- `@stackra/settings` exports: `SettingType.Choice`, `SettingType.List`, `SettingKeyInput.options`, and
  `SettingValue | readonly string[]`. All are additive.
- `@stackra/gen` exports: `settingsOf`, `settingsKeyOf` and `settingTypeOf`. All are additive.
- No action, query, event or endpoint changes.

## Error handling

New gen codes, each a `GenError` with a file, a subject and a fix:

| Code                        | Subject                  | Fix                                                                                                 |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `settings_unsupported_type` | `Class.field`            | type it as boolean, number, string, a brand, an enum, `PublicId<"conn">`, or a string or enum array |
| `settings_scope_widened`    | `Class.field`            | list only scopes of `<enclosing>`                                                                   |
| `settings_too_deep`         | `Section.field`          | sections nest one level deep: flatten the field into the section                                    |
| `settings_group_key_empty`  | `Class`                  | name the class `<Group>Settings`                                                                    |
| `settings_group_conflict`   | the group key            | rename one class, or override the dependency's class in `src/overrides/`                            |
| `identity_changed`          | `Class` or `Class.field` | add `@Renamed("<old>")`, or restore the name                                                        |

Gen collects every error and writes nothing when one exists, as it does today.

## Security and tenancy

none. No permission, tenant data, personal data or secret is involved. Choice validation narrows what a write accepts.

## Testing strategy

- AC-001, AC-002: `setting-type-of.function.test.ts` (every `TypeDesc` kind), `settings-of.function.test.ts`
  (refusal on `json`, `money`, `public_id<usr>`, `number[]`), and `emit-settings.function.test.ts` (choice and list
  output, unchanged labels). The settings package's `is-setting-value.function.test.ts` and
  `setting-type.enum.test.ts` cover the runtime half.
- AC-003: `settings-of.function.test.ts` (two own classes; own against a dependency manifest; an override is not a
  conflict; two dependencies).
- AC-004: the gen `settings-key-of.function.test.ts`, with the runtime test's cases (`OrdersSettings`,
  `LoyaltyKitSettings`, an override), plus `AccountSettings` in module `settings` through `emitSettings`, and the
  `Settings.pick` reader test with a stem other than the module key.
- AC-005: `build-manifest.function.test.ts` (the section, absent with no settings) and
  `check-identity-lock.function.test.ts` (class key change, field rename with and without `@Renamed`, plain removal).
- AC-006: `settings-of.function.test.ts` (field, section and inner field cases; non-constant scopes skipped).
- Whole run: on ci-box, `stackra gen` over the repository then `stackra gen --check`, the gen and settings test
  suites, the typecheck of both packages, and `pnpm verify`.

## Rollout

none beyond the release. One changeset gives a minor bump to `@stackra/gen` and `@stackra/settings`. The four
committed package manifests are regenerated in the same PR, so `gen --check` stays green. A downstream member that
upgrades gen and has an enum setting field gets `choice` keys. This is noted in the changeset.

## Delegation and risk plan

One session, one PR, route `gen` for the gen tasks and `package` for the settings runtime. The risks are the
`SettingValue` widening reaching `diffSettingsPacks`, the YAML packs or `mergeSettingLayers`, where values are compared
or serialised. The typecheck on ci-box finds every site. Array equality uses the existing JSON comparison where one
exists; otherwise the task adds a structural compare at that site. The work merges `origin/main` in before shipping,
because STA-2044, STA-2045 and STA-2046 edit `build-manifest`, `emit-boot` and `emit-registrations`.

## ADRs

ADR 0496 (decisions 5 to 7 and 9, and Enforcement), ADR 0307 (rules 22 and 23), ADR 0294 (decisions 5, 20 and 22),
ADR 0306 (overrides keep the name). All are Accepted. No draft is opened.

## Docs

`packages/developer/gen/README.md` (the settings keys bullet: group key from the class name, choice and list, the
refusals, the manifest section) and `packages/state/settings/README.md` (`SettingType` gains `choice` and `list`).

## Complexity tracking

none
