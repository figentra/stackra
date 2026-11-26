# Feature Specification: what gen writes typechecks, and every library member checks it

**Feature Branch**: `figentra/sta-1605-gen-schemas-typecheck`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-1605

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: STA-1605 found that gen's generated schema code (`.stackra/gen/schemas/*.ts`) had never been typechecked:
once the presets reached it, 36 core packages failed on generated code (TS2769, TS2344, TS2717 and others), hidden by a
dts-only build tsconfig in the template. STA-1657 reported every model's `X$Check` failing because a trait's public
id was read as `json()`. Done when gen's emitted code typechecks under each member's tsconfig, a gen test typechecks
a generated fixture, and the presets include the generated entries. This spec is written from what the branch built.

### Sources

- `packages/developer/gen/src/core/functions/emit-schemas.function.ts`, `emit-entities.function.ts`,
  `emit-hosted-entities.function.ts`, `emit-wiring.function.ts`, `driver-name.function.ts`,
  `root-module-of.function.ts`, `system-driver-defaults.function.ts`, `build-manifest.function.ts` (before and after)
- `packages/developer/gen/src/node/functions/create-source-reader.function.ts`, `discover-member.function.ts`
- `packages/foundation/validation/src/core/types/fields.type.ts`, `input-fields.type.ts`
- `packages/foundation/container/src/core/types/wiring.type.ts`, `packages/tooling/typescript/src/library.json`
- ADR 0294 (decision 26: the shape compiler and `X$Check`), ADR 0263 (gen writes the wiring; drivers by file prefix),
  ADR 0305 (rules 15 and 16: the root module), ADR 0295 (generated entries)
- A typecheck of every member with `.stackra/gen` (99 packages) with the generated folders included, before (72
  errors in the probe on main) and after (none)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (the playground's committed manifest drifts on main for reasons outside this change; it is
  left as it is)
- **Services touched**: none
- **Packages touched**: packages/developer/gen, packages/foundation/validation (`withDefault`, `DefaultLiteral`,
  `Fields`, `InputFields`), packages/foundation/container (`Wiring.platform`), packages/tooling/typescript (the
  `library` preset), packages/cross-cutting/analytics, packages/experience/panel, packages/state/settings,
  packages/application/registry (source schemas the new check found wrong), and the regenerated manifests of
  packages/security/csp, packages/data/database, packages/developer/cli, packages/developer/runway,
  packages/experience/platform, packages/commerce/fiscal and workers/edge, workers/registry, workers/static,
  workers/turbo-cache
- **Public contract change**: additive exports and a manifest change. `@stackra/validation` exports `withDefault` and
  the type `DefaultLiteral`; `Fields` and `InputFields` drop symbol keys; `Wiring.platform` admits `Container`. Gen's
  `ShapeIR` gains an optional `typeParameters`, `MemberIR` an optional `authoredDriverKeys`, `SourceReader` a
  `driverRegistryKeys()`, and `driverName` an optional third argument (the port's member). A driver of a port named
  after its member gets a shorter name in the manifest (`expo_push_transport` → `expo`, `cloudflare_workers_provider`
  → `cloudflare_workers`, `cades_signer` → `cades`), the names the packages' `DriverRegistry` stand-ins already used.
  A member off the container gets no module class in its manifest. The `library` preset includes `.stackra/gen` and
  `.stackra/entry`. Nothing is removed from an export list.
- **Cross-service events**: none
- **Tenancy and data**: none; no runtime data or tenant rows are read. `@stackra/settings` now stores a list of
  strings as `SettingValue` already allowed, so a stored list no longer fails its own schema.
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no; implements ADR 0294 decision 26 and ADR 0263 as written
- **New dependencies**: none
- **Deploy modes**: same in all three (gen runs at development time; the analytics, panel and settings schema fixes
  are the same everywhere)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/tooling/typescript/README.md` (the `library` row names the generated folders),
  `.changeset/gen-schemas-typecheck.md`
- **Lane**: full (new public exports, a preset change and a manifest name change across several packages)
- **Change risk**: R2 (a public preset and the driver names in three manifests; every library member now typechecks
  its generated files)

## Glossary _(full lane)_

- **Generated schema**: `.stackra/gen/schemas/<module>.ts`, the zod `X$` gen compiles from a shape class, with its
  `X$Check` type that asserts `z.output<typeof X$>` is the class's `Fields`.
- **Driver name**: the code a config or runway value selects a driver by, taken from the driver file's stem.
- **Stand-in**: a package's authored `DriverRegistry` augmentation naming every driver of its port (ADR 0263
  decision 9).
- **Literal default**: an object or array initializer gen evaluates into the schema's `.default`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A member's typecheck covers what gen writes (Priority: P1)

A package author runs `pnpm typecheck` in a library member. The generated schemas, wiring and entries are in the
program, so a type error in generated code fails the member's own check instead of a consumer's build.

**Why this priority**: generated code that never typechecks hides real mismatches between a class and its schema.

**Independent Test**: the presets test reads `library.json`; every member with `.stackra/gen` runs `tsc --noEmit`.

**Acceptance Scenarios**:

1. **Given** the `library` preset, **When** a member extends it, **Then** `.stackra/gen` and `.stackra/entry` are in
   its program beside `src`.
2. **Given** every member of this repo regenerated, **When** each runs `tsc --noEmit`, **Then** none reports an error.

---

### User Story 2 - A literal default keeps its types (Priority: P1)

A shape field's initializer is an object of codes, a record of codes or an object holding a `Duration`. The generated
schema types the literal by the field's output, so a code stays its literal type and `X$Check` holds.

**Independent Test**: the generated-schemas typecheck test runs `generate` on a fixture and typechecks the result.

**Acceptance Scenarios**:

1. **Given** `card = { statuses: [OrderStatus.Pending], width: 1200 }` under a hatch, **When** gen writes its schema,
   **Then** it is `withDefault(<hatch>)(() => ({ … }))` and typechecks.
2. **Given** a wrong code in such a literal, **When** it is typechecked, **Then** it does not compile.

---

### User Story 3 - Models, generic shapes and wiring typecheck (Priority: P1)

A model with getters and a `[OptionalProps]` marker, a generic base shape, a package with a driver stand-in, a native
driver variant and a Worker-only driver all produce generated code that typechecks.

**Acceptance Scenarios**:

1. **Given** a model with computed getters, **When** gen writes its `X$Check`, **Then** the getters are omitted.
2. **Given** `ChangeBase<S>`, **When** gen writes its check, **Then** it reads `Fields<ChangeBase<any>>`.
3. **Given** a stand-in declaring `"platform.PlatformPushTransport"`, **When** gen writes the wiring, **Then** the
   wiring does not declare that key again, and the driver names match the stand-in's.
4. **Given** a member that does not declare `@stackra/container`, **When** gen writes its manifest and entries,
   **Then** neither names a module class.

---

### Edge Cases

- **EC-01**: A driver-name field whose port has no driver reaching the member is any string; `z.enum([])` refused
  every value.
- **EC-02**: A platform constructor's default (Money) and a primitive stay a plain `.default(value)`.
- **EC-03**: A file of another member whose name starts with this member's name is no prefix (`expo-push-transport`
  for a `queue` port stays `expo_push_transport`).
- **EC-04**: Each parse of a literal default gets its own object.
- **EC-05**: Gen's own output under `.stackra/` never counts as an authored `DriverRegistry` augmentation.
- **EC-06**: A server member's wiring still lists no browser, React Native or Electron driver.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `library` preset SHALL include `${configDir}/.stackra/gen` and `${configDir}/.stackra/entry`.
- **FR-002**: WHEN a field's default is a literal object or array THE gen SHALL write `withDefault(<schema>)(() =>
(<literal>))`, and `withDefault` SHALL type the literal by the schema's output with brands read as their base.
- **FR-003**: THE gen SHALL omit a model's computed getters from its `X$Check` and SHALL check a generic shape over
  `any` arguments.
- **FR-004**: THE gen SHALL write no `~defaults` brand for a config, a model, a model addition or a generic shape, and
  the entity files SHALL not list one.
- **FR-005**: `Fields` and `InputFields` SHALL drop symbol keys.
- **FR-006**: THE wiring SHALL not augment a `DriverRegistry` key an authored augmentation in the member's program
  declares, SHALL keep one candidate per driver name (the neutral one over a client variant) and SHALL list a
  package's `./worker` driver only for a Worker member.
- **FR-007**: `driverName` SHALL strip a port's member-named prefix from the port's name when matching the stem.
- **FR-008**: An imported class SHALL keep the name its import specifier exports it under.
- **FR-009**: A member that does not use the container SHALL have no root module.
- **FR-010**: A driver-name field with no candidate driver SHALL compile to `z.string()`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a library member is typechecked THE program SHALL include its generated schemas, wiring and entries.
- **AC-002**: WHEN gen writes a schema with literal object, record and duration defaults THE generated schemas and wiring SHALL typecheck under a strict tsconfig.
- **AC-003**: WHEN every member of the repository is regenerated THE `tsc --noEmit` of each member with `.stackra/gen` SHALL report no error.
- **AC-004**: WHERE a port is named after its member THE driver names SHALL be the stem without the member-less port name.
- **AC-005**: IF a member does not declare `@stackra/container` THEN THE gen SHALL name no root module for it.
- **AC-006**: WHILE an authored stand-in declares a `DriverRegistry` key THE generated wiring SHALL not declare it again.

## Success Criteria _(mandatory)_

- **SC-001**: `generated-schemas-typecheck.test.ts` (gen) runs `generate` on the shop fixture plus a display schema
  and typechecks the output with gen's TypeScript, and fails without the emit change — verified by: integration
- **SC-002**: `driver-name.function.test.ts`, `port-member.function.test.ts`, `root-module-of.function.test.ts` (gen),
  `with-default.function.test.ts`, `fields.type.test.ts` (validation), `driver-name.type.test.ts` (container) and
  `presets.test.ts` (typescript-config) prove FR-001, FR-002, FR-005, FR-007, FR-009 — verified by: unit
- **SC-003**: every one of the 99 members with `.stackra/gen` passes `tsc --noEmit` after `pnpm gen` — verified by:
  manual (box 2)
- **SC-004**: the touched packages' tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- A config that selected a platform push transport, a runway provider or a fiscal signer or onboarding driver by its
  old long name selects it by the short name; no file in this repo or the template used a long name.
- A library member outside this repo on the `library` preset now typechecks its generated files; a type error there
  is a real mismatch between a class and its schema to fix in the source.
- Run `stackra gen` and commit the regenerated manifests.

## Risks

- **R-1**: A downstream member's typecheck newly fails on generated code. Mitigated: every member here passes, and the
  failures name a real mismatch.
- **R-2**: The analytics destination `include` and `exclude` no longer default to `[]` in the parsed config. Both
  readers already treat absent as every event (`?? []`).

## Out of scope

- The declaration build (the gen-written `tsconfig.build.json`) still emits from `src` and `.stackra/entry` only:
  the typecheck, not the declaration build, is where generated code is now checked.
- The playground's committed manifest drift on main.

## Assumptions

- STA-1657 (a trait's public id read as `json()`) is fixed on main by the template-literal reading of STA-1720; the
  member-wide typecheck above, with every model's `X$Check` in the program, confirms it.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-1605, batch 13) · written from the branch's diff
- 2026-11-26 · Draft → Clarified · Claude (STA-1605, batch 13) · clarifications complete (none open)
- 2026-11-26 · Clarified → Planned · Claude (STA-1605, batch 13) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-1605, batch 13) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-1605, batch 13) · T001 to T010 done on the branch; the Planned approval is the approver's to write (ADR 0502)
