# Plan: `@stackra/state-machine` wave 4

**Spec**: `.agents/specs/sta-348-state-machine/spec.md`

## Design

- `StateMachine` (`src/core/bases/state-machine.base.ts`): `createKind("state_machine", StateMachineBase, read)` cast
  to a called-only partner kind, `<M extends object = never>(options: WithPartner<M, StateMachineOptions<M>, hint>)`.
  `read` refuses an empty `field` and a non-boolean `history`.
- The base constructor reads its options with `kindOf(new.target)` and, for every `Transition.members(new.target)`
  entry, defines an own property that wraps the prototype method with `guardTransition`. The decorator itself records
  only, as every `createDecorator` decorator does.
- `guardTransition` (internal): checks `record[field]` against `from`, else throws `TransitionNotAllowedError`; runs
  the body; writes `to`; records `StateTransitioned` when `history` is on. A thenable result defers the write and the
  record to its resolution.
- `can` and `available` read the same metadata from `this.constructor`; `TransitionName<this, M>` types the name as a
  method of the subclass taking the record first.
- `StateTransitioned` is a `DomainEvent` that registers its own shipped zod schema at load (the `CursorInput`
  pattern), so `StateTransitioned.create` works without gen.
- `TransitionNotAllowedError extends Refusal({ kind: ErrorKind.Conflict, retryable: false })`, details `transition`
  and `state`.

## Constitution check

- Boundaries: imports `@stackra/{container,errors,events,validation}` and `zod` (and `@stackra/contracts` in
  `stackra.config.ts`); never @stackra/model (the machine needs any object with the field; ADR 0161 consequences: a
  machine runs without a model), @stackra/database, an app, a service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; kind code `state_machine`, decorator code `transition`.
- Secrets: none.

## Risks

- The registry row lists `model` as a dependency; nothing here needs it, so it is left out (knip would flag it).
- The template's gen sample writes the wiring kind as `state-machine`; the kind registry code is snake_case
  `state_machine`, like `domain_event` and `extension_point`. Gen maps it.
- A transition method called through `Prototype.method.call(...)` bypasses the guard; only the instance is guarded.
