---
description: "Tasks for STA-2056: settings field types, Choice and List, section scopes, one class per group, the settings manifest section"
---

# Tasks: Settings field types, Choice and List, section scopes, one class per group, the settings manifest section

**Input**: Design documents from `.agents/specs/sta-2056-settings-field-types/`

**Prerequisites**: plan.md, spec.md

One pull request. Every install, gen, typecheck and test runs on ci-box.

## Phase 1: Foundational

- [ ] T001 Add `Choice` (`choice`) and `List` (`list`) to `SettingType` in `packages/state/settings/src/core/enums/setting-type.enum.ts`, `options?: readonly string[]` to `packages/state/settings/src/core/types/setting-key-input.type.ts`, and `readonly string[]` to `packages/state/settings/src/contracts/types/setting-value.type.ts` — covers: FR-005, AC-002 — route: package
- [ ] T002 [P] Test first: choice membership, list of strings, list against options, and the existing cases unchanged in `packages/state/settings/src/core/functions/__tests__/is-setting-value.function.test.ts`; the two new codes in `packages/state/settings/src/core/enums/__tests__/setting-type.enum.test.ts` — covers: FR-005, P-003, AC-002 — route: tests — deps: T001
- [ ] T003 `isSettingValue` accepts a choice only in `options`, and a list only as strings (each in `options` when given), in `packages/state/settings/src/core/functions/is-setting-value.function.ts`; fix every typecheck site of the widened `SettingValue` (packs diff, YAML, merge) with a structural compare for arrays — covers: FR-005, P-003, AC-002 — route: package — deps: T002
- [ ] T004 [P] The forms edit `choice` as text and `list` as comma-separated text in `packages/state/settings/src/react/settings-form/settings-form.tsx` and `packages/state/settings/src/native/settings-form/settings-form.tsx`, with cases in their `__tests__`; the comment of `packages/state/settings/src/core/functions/settings-key-of.function.ts` says gen derives the key from the class name — covers: FR-006, AC-002 — route: frontend — deps: T003

## Phase 2: User Story 2 - Gen and the runtime agree on every group key (Priority: P1)

**Goal**: one group key rule in gen, equal to the runtime's.

**Independent Test**: the runtime's `settingsKeyOf` cases give the same keys in gen.

- [ ] T005 [US2] Test first, then `settingsKeyOf(className)` with the runtime rule in `packages/developer/gen/src/core/functions/settings-key-of.function.ts` and `packages/developer/gen/src/core/functions/__tests__/settings-key-of.function.test.ts` (`OrdersSettings`, `LoyaltyKitSettings`, `AccountSettings`, an empty stem) — covers: FR-001, P-001, AC-004 — route: gen

## Phase 3: User Story 1 - An author's settings field is never dropped silently (Priority: P1)

**Goal**: every field maps or is refused; choice and list keys emit.

**Independent Test**: `settingsOf` and `emitSettings` over `json`, `money`, enum and `string[]` fields.

- [ ] T006 [US1] Test first, then `settingTypeOf(field)` (every `TypeDesc` kind: boolean, integer, number, string and brand, connection, enum and driver name to choice, string or brand or enum arrays to list, the rest undefined) in `packages/developer/gen/src/core/functions/setting-type-of.function.ts` and `packages/developer/gen/src/core/functions/__tests__/setting-type-of.function.test.ts` — covers: FR-002, FR-003, FR-004, P-002, AC-001, AC-002 — route: gen
- [ ] T007 [US1] Test first, then `settingsOf(ir)`: the entries, plus `settings_unsupported_type`, `settings_too_deep`, `settings_group_key_empty`, `settings_scope_widened` and `settings_group_conflict` (own pairs, own against a dependency manifest, an override exempt, two dependencies), in `packages/developer/gen/src/core/functions/settings-of.function.ts` and `packages/developer/gen/src/core/functions/__tests__/settings-of.function.test.ts` — covers: FR-002, FR-007, FR-008, FR-009, FR-010, FR-014, P-002, P-004, P-005, AC-001, AC-003, AC-006 — route: gen — deps: T005, T006
- [ ] T008 [US1] `emitSettings` groups by the derived key, writes `options`, and uses the label rule of FR-013, with tests in `packages/developer/gen/src/core/functions/emit-settings.function.ts` and `packages/developer/gen/src/core/functions/__tests__/emit-settings.function.test.ts` (choice, list, today's labels byte-identical, `AccountSettings` in module `settings`) — covers: FR-001, FR-003, FR-004, FR-013, P-007, AC-002, AC-004 — route: gen — deps: T007

## Phase 4: User Story 3 - A scope a field cannot have is refused (Priority: P2)

**Goal**: widened scopes refused at gen; the approval keys follow the group key.

**Independent Test**: the scope cases of T007 and an approval key of a group whose stem differs from its module.

- [ ] T009 [US3] `approvalKeys` keys by the group key in `packages/developer/gen/src/core/functions/check-approval.function.ts`, with a case in `packages/developer/gen/src/core/functions/__tests__/check-approval.function.test.ts` — covers: FR-001, FR-007, AC-004, AC-006 — route: gen — deps: T005
- [ ] T010 [US3] `Settings.pick` resolves `Settings.<group>.<name>` by the derived key in `packages/developer/gen/src/node/functions/create-source-reader.function.ts`, with a case in `packages/developer/gen/src/node/functions/__tests__/create-source-reader.function.test.ts` — covers: FR-001, AC-004 — route: gen — deps: T005

## Phase 5: User Story 4 - The manifest records and locks every setting key (Priority: P2)

**Goal**: the `settings` section, and the lock over group keys and key paths.

**Independent Test**: `checkIdentityLock` over a locked and a derived manifest.

- [ ] T011 [US4] `buildManifest` writes `settings` from `settingsOf` and joins its errors, with tests in `packages/developer/gen/src/core/functions/build-manifest.function.ts` and `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts`; export the new functions from `packages/developer/gen/src/core/index.ts` and list them in `packages/developer/gen/src/core/__tests__/index.test.ts` — covers: FR-010, AC-005 — route: gen — deps: T007
- [ ] T012 [US4] `settings: "key"` in `LOCKED`, and the key-path pass, in `packages/developer/gen/src/core/functions/check-identity-lock.function.ts`, with tests in `packages/developer/gen/src/core/functions/__tests__/check-identity-lock.function.test.ts` (class key change, field rename with and without `@Renamed`, plain removal) — covers: FR-011, FR-012, P-006, AC-005 — route: gen — deps: T011

## Phase 6: Polish

- [ ] T013 Merge `origin/main` in, run `stackra gen` on ci-box, commit the regenerated `packages/commerce/loyalty-kit/stackra.manifest.json`, `packages/data/search/stackra.manifest.json`, `packages/state/query/stackra.manifest.json` and `packages/state/settings/stackra.manifest.json`, then `stackra gen --check` and `pnpm verify` green; add `.changeset/settings-field-types.md` — covers: SC-003, AC-005 — route: codegen-drift — deps: T004, T008, T009, T010, T012
- [ ] T014 [P] Docs in `packages/developer/gen/README.md` (the settings keys bullet) and `packages/state/settings/README.md` (`SettingType`) — covers: SC-001, SC-002, AC-001, AC-004 — route: steward-docs — deps: T013
