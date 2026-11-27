# Implementation Plan: commands share a set of options, declared once

**Spec**: `.agents/specs/sta-2924-console-shared-option-sets/spec.md` · **Linear**: STA-2924 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2924-console-shared-option-sets/spec.md`

## Summary

A new bare kind base `OptionSet` holds `@Option` fields. A command takes a set with `@Options(SomeOptionSet)` on one
field. `readCommand` reads the set's option fields after the command's own, each marked with `set` (the field), through
the same flag registry, so a clash is a `ConsoleDeclarationError`. `fillCommand` puts each parsed value on the set
instance or on the command. The kind `option_set` joins the field-carrying kinds of `@stackra/validation` (so `@Str` and
the other value decorators may mark it), gen's kind tables and the coding standard's.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `@stackra/console`, `@stackra/validation`, `@stackra/gen`, `@stackra/coding-standard` (developer and
  foundation)
- **Testing**: vitest in `src/**/__tests__/`
- **Storage**: none
- **Runtime target**: any console built on `@stackra/console` (the `stackra` binary first)

## Constitution Check

| Law                                   | Result | Note                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | console uses container and validation, as before; no new edge         |
| Secrets (ADR 0009)                    | N/A    | none                                                                  |
| Security                              | PASS   | declaration only; nothing read or written outside the command         |
| HTTP and events                       | N/A    | none                                                                  |
| Tenancy                               | N/A    | none                                                                  |
| Delegation                            | PASS   | Claude only                                                           |
| Not built yet (ADR 0011)              | PASS   | nothing referenced that is not built                                  |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                 |
| Versions and catalogs                 | PASS   | a changeset: console minor, validation, gen and coding-standard patch |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                             |
| Docs and ADRs                         | PASS   | console guide and README; the kind tables gain one row each           |

## Deploy modes

| Mode       | Behaviour                               |
| ---------- | --------------------------------------- |
| SaaS       | a library feature of the console kernel |
| On-prem    | the same                                |
| Air-gapped | the same                                |

## Correctness properties

- **P-001**: two commands with one set keep their names, and each lists every shared flag once — Validates: FR-001, AC-001, AC-002
- **P-002**: a run fills the set instance and the command's own fields; defaults hold without flags or initialiser — Validates: FR-002, AC-003, AC-004
- **P-003**: a clash with the command's flag or another set's is a ConsoleDeclarationError — Validates: FR-003, AC-005
- **P-004**: the option_set kind is in the validation, gen and coding-standard tables — Validates: FR-001, AC-006

## Architecture overview

`OptionSet` is a bare kind base (`registerKind(OptionSet, "option_set")`). `@Option` may mark commands and option sets;
`@Options(set)` may mark command fields only and records the set class. `readCommand(type)` reads the command's own
options, then for each `@Options` field the set's `@Option` fields, with defaults from an instance of the set, through
the same `claim` registry of flags and letters, and marks each with `set: <field>`. The parsed values stay keyed by
property (a clash cannot reach them). `fillCommand` builds any missing set instance and routes each value by its field's
`set`.

## Components and responsibilities

- `OptionSet` (`core/bases/option-set.base.ts`): the kind base of a set.
- `Options` (`core/decorators/options.decorator.ts`): the field decorator and its `members`.
- `OptionSetClass` (`core/types/option-set-class.type.ts`): the class `@Options` takes.
- `CommandField.set` (`contracts/types/command-field.type.ts`): which field holds a shared option.
- `readCommand` (`core/functions/read-command.function.ts`): reads the sets and refuses a clash.
- `fillCommand` (`core/functions/fill-command.function.ts`), used by `runCommand`: puts the values on the command.
- `SHAPE_KINDS` (validation), `KIND_BASES` and `KIND_FILES` (gen), `KIND_BASES` (coding standard): the new kind.

## Files and folders

Every file the change adds or edits (tests and the changeset aside):

```text
apps/docs/src/docs/guides/console.mdx
packages/developer/coding-standard/src/core/constants/kind-bases.constant.ts
packages/developer/console/README.md
packages/developer/console/src/contracts/types/command-field.type.ts
packages/developer/console/src/core/bases/option-set.base.ts
packages/developer/console/src/core/decorators/option.decorator.ts
packages/developer/console/src/core/decorators/options.decorator.ts
packages/developer/console/src/core/functions/fill-command.function.ts
packages/developer/console/src/core/functions/read-command.function.ts
packages/developer/console/src/core/functions/run-command.function.ts
packages/developer/console/src/core/index.ts
packages/developer/console/src/core/types/option-set-class.type.ts
packages/developer/gen/src/core/constants/kind-files.constant.ts
packages/developer/gen/src/node/constants/kind-bases.constant.ts
packages/foundation/validation/src/core/constants/shape-kinds.constant.ts
```

## Data models and migrations

none

## Contracts

```ts
export abstract class OptionSet {
  declare readonly "~kind": "option_set";
}
export type OptionSetClass = new () => OptionSet;
export function Options(set: OptionSetClass): (target: object, property: string) => void;
// CommandField
readonly set?: string;
```

## Error handling

- A shared flag or letter another option already takes: `ConsoleDeclarationError` "`<a> and <b> both use "<flag>"`".
- A set field that is also an `@Option` or `@Argument`: `ConsoleDeclarationError`.
- `@Option` on a class of another kind keeps its `TypeError` from `createDecorator`.

## Security and tenancy

None touched: a declaration feature of a developer library. No data, secret or network.

## Testing strategy

- P-001 to P-003: `packages/developer/console/src/core/functions/__tests__/option-sets.test.ts` (help, parsing,
  defaults, the clash errors, an option set read as a command).
- P-004: the validation, gen and coding-standard table tests run with the new row; STA-2883's `check.option-set.ts`
  passes `stackra gen --check`.
- Revert checks: undoing `read-command.function.ts`, `run-command.function.ts` or `option.decorator.ts` fails the test.

## Rollout

One changeset. Additive; STA-2883 (stackra#1177) adopts it for `check` and its presets. Ships with the next release.
