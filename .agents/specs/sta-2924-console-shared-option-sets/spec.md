# Feature Specification: commands share a set of options, declared once

**Feature Branch**: `figentra/sta-2924-console-shared-option-sets`

**Created**: 2026-11-27

**Status**: Planned <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: CTO

**Linear**: STA-2924

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: STA-2924, from the CTO's ruling on stackra#1177 (STA-2883) of 2026-11-27. `stackra check` and its presets
(`validate`, `verify`, `code:check`, `code:fix`) are five console command classes that each declare the same eight
flags, which raised the duplication of `@stackra/cli` from 0.93% to 1.72%. The ruling: no baseline raise; the console
kernel gets a shared option set that is not a base command class, each command keeps its own name, help lists the
shared flags once, gen understands it, and a command flag that clashes with a shared one is a declaration error.

### Sources

- `packages/developer/console/src/core/functions/read-command.function.ts`, `run-command.function.ts` and
  `core/decorators/option.decorator.ts` on the STA-2872 branch (how fields become options and values reach a command)
- `packages/foundation/container/src/core/functions/create-decorator.function.ts` (a field decorator marks only the
  kinds it names) and `register-kind.function.ts` (a bare kind base)
- `packages/foundation/validation/src/core/constants/shape-kinds.constant.ts`, gen's `KIND_BASES` and `KIND_FILES`, and
  the coding standard's `KIND_BASES` (a new field-carrying kind joins all of them in the same change)
- ADR 0506 (`@stackra/console` is the command kernel), ADR 0294 (decisions 16 and 25: the kind table and kind bases)
- FR-001 to FR-003: the CTO's ruling on stackra#1177 and the branch's tests (`option-sets.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/docs (the console guide)
- **Services touched**: none
- **Packages touched**: packages/developer/console (`OptionSet`, `@Options`, `OptionSetClass`, `CommandField.set`,
  `readCommand`, `fillCommand`), packages/foundation/validation (`SHAPE_KINDS`), packages/developer/gen (`KIND_BASES`,
  `KIND_FILES`), packages/developer/coding-standard (`KIND_BASES`)
- **Public contract change**: additive. `@stackra/console` exports `OptionSet`, `Options` and the type
  `OptionSetClass`; `CommandField` gains the optional `set`. A new kind code `option_set` with the file
  `<name>.option-set.ts` and the class suffix `OptionSet`. Nothing is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no new ADR; extends ADR 0506's command kernel and adds one row to ADR 0294's kind table, as the kind
  tables' own rule asks (the kind joins every table in the same change)
- **New dependencies**: none
- **Deploy modes**: same in all three (a developer library)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal output only)
- **Docs to update**: `apps/docs/src/docs/guides/console.mdx`, `packages/developer/console/README.md`, a changeset
- **Lane**: full (a public option on the console kernel and a new kind)
- **Change risk**: R1 (a new, opt-in declaration; no existing command changes)

## Glossary _(full lane)_

- **Option set**: a class extending `OptionSet` whose `@Option` fields several commands share.
- **Set field**: the command field marked `@Options(SomeOptionSet)` that holds the set instance.
- **Shared flag**: an option that comes from an option set.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Declare shared flags once (Priority: P1)

A package author has several commands that take the same flags. They declare the flags once in an option set and give
it to each command; each command keeps its name and help.

**Independent Test**: two commands with one set, run through `runCommandForTest`.

**Acceptance Scenarios**:

1. **Given** two commands taking one set, **When** `list --json` runs, **Then** both are listed under their own names.
2. **Given** a command with a set and an option of its own, **When** its help runs, **Then** each shared flag appears
   once, beside its own option.
3. **Given** a run with shared and own flags, **Then** the set instance and the command's field hold them.

---

### User Story 2 - A clash is caught at declaration (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a command whose own option has the name of a shared flag, **When** it is read, **Then** a
   `ConsoleDeclarationError` names both.

---

### Edge Cases

- **EC-01**: A set field with no initialiser gets a set instance built with no arguments before `handle` runs.
- **EC-02**: Two sets on one command that share a flag are a declaration error.
- **EC-03**: A set field that is also an `@Option` or `@Argument` is a declaration error.
- **EC-04**: An option set is not a command: `readCommand` refuses it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE console SHALL let a command take the `@Option` fields of an `OptionSet` class through one field
  marked `@Options(SomeOptionSet)`, listing each of them once among the command's options with the command's own name
  and help unchanged.
- **FR-002**: WHEN a command runs THE console SHALL put each shared flag's value on the set instance of its field,
  built from the set class when the field has none, and every other value on the command.
- **FR-003**: IF a shared flag takes a name or letter another option of the command already takes (its own or another
  set's) THEN THE console SHALL refuse the command with `ConsoleDeclarationError`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN two commands take one option set THE console SHALL list them under their own names.
- **AC-002**: WHEN a command's help runs THE console SHALL list each shared flag exactly once.
- **AC-003**: WHEN a command runs with shared flags THE console SHALL fill the set instance on its field.
- **AC-004**: WHERE no shared flag is given THE set SHALL hold its defaults, with or without an initialiser.
- **AC-005**: IF a command flag clashes with a shared flag of the same name THEN THE console SHALL throw
  `ConsoleDeclarationError`.
- **AC-006**: THE kind `option_set` SHALL be known to `@stackra/validation`, gen and the coding standard.

## Success Criteria _(mandatory)_

- **SC-001**: `option-sets.test.ts` proves AC-001 to AC-005 and fails with `read-command.function.ts` or
  `run-command.function.ts` reverted — verified by: unit
- **SC-002**: the `@stackra/console`, `@stackra/validation`, `@stackra/gen` and `@stackra/coding-standard` tests,
  typecheck and lint pass; STA-2883 uses the set and `stackra duplication` passes — verified by: unit

## Compatibility and migration

- Additive: a command without `@Options` reads and runs exactly as before. `CommandField.set` is optional, so a
  renderer or tool that ignores it keeps working.

## Risks

- **R-1**: A shared flag and a command flag drift apart in meaning. Mitigated: a name clash is a declaration error, so
  one flag name has one declaration.

## Out of scope

- Option sets for `@Argument` fields (shared flags are options only).
- Changing any existing command (STA-2883 adopts the set in its own branch).

## Assumptions

- Option sets are small, flat classes; a set inside a set is not needed.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-27 · — → Draft · Claude (STA-2924 session) · created from the CTO's ruling on stackra#1177
- 2026-11-27 · Draft → Clarified · Claude (STA-2924 session) · the ruling settles the shape; no open question
- 2026-11-27 · Clarified → Planned · Claude (STA-2924 session) · plan.md; tasks.md is written with the branch, and the
  status stays Planned until the approver's Planned approval (ADR 0502)
