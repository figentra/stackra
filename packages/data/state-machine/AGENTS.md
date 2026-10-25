# AGENTS — @stackra/state-machine

The lifecycle of one model field: the `StateMachine<M>({ field, history })` kind base and `@Transition` (ADR 0161, 0294
note). Member at `packages/data/state-machine` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entry `.` only.

## Where code goes

| You are writing… | It goes in…                                   |
| ---------------- | --------------------------------------------- |
| The kind base    | `src/core/bases/state-machine.base.ts`        |
| The decorator    | `src/core/decorators/transition.decorator.ts` |
| A refusal        | `src/core/errors/<name>.error.ts`             |
| A domain event   | `src/core/events/<name>.event.ts`             |
| A type           | `src/core/types/<name>.type.ts`               |
| A constant       | `src/core/constants/<name>.constant.ts`       |
| A test           | `__tests__/<name>.<kind>.test.ts` beside it   |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.
- `StateMachineBase` is exported as a type only. The shipped `StateTransitioned` schema stays internal.

## This package

- `StateMachine` is called only, with the model as the type argument (`WithPartner` gives the hint without it).
- `@Transition` records only (`createDecorator`); the base wraps each transition when the machine is constructed.
- A transition's condition is its precondition (`from`). Never name anything Guard or Gate (ADR 0294 decision 23).
- The check, the body and the write run in the caller's call; never defer them to a queue or a later tick.
- Only add a symbol a consumer imports today (the template, a package, or the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties, no XState or other state-machine library.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/state-machine` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data          | Where                       | Handling                                                                         |
| ------------- | --------------------------- | -------------------------------------------------------------------------------- |
| Record state  | `StateTransitioned`         | Field name, state codes and the record's public id only; no other field is read. |
| Refusal state | `TransitionNotAllowedError` | The transition name and the state code; never another field of the record.       |
