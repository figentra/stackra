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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/state-machine`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/events`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                      |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                                                    |
| HTTP and events                       | PASS   | `StateTransitioned` is the event type listeners handle; the package declares no endpoint                                                                                                                                 |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                           |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                   |
| Not built yet (ADR 0227)              | PASS   | no XState or other state-machine library (ADR 0161 decision 1, ADR 0227)                                                                                                                                                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                        |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                          |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                  |

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

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` names `@stackra/state-machine` at `packages/data/state-machine` and `exports` lists only `.` — Validates: FR-001
- **P-002**: `.` exports `StateMachine`, `Transition`, `TransitionNotAllowedError`, `StateTransitioned` and the types `StateMachineOptions`, `TransitionOptions`, `TransitionName` and `StateField` — Validates: FR-002
- **P-003**: `StateMachine<Order>({ field, history })` is a called-only kind base of kind `state_machine` whose partner is the type argument, and it inherits `can(record, name)` and `available(record)` — Validates: FR-003
- **P-004**: `Transition` is made with `createDecorator` (method target, kind `state_machine`), records metadata only, and the base applies it when the machine is constructed — Validates: FR-004
- **P-005**: the check, the body and the state write of a transition run synchronously inside the caller's call, so they share its unit of work — Validates: FR-005
- **P-006**: `package.json` lists no XState or other state-machine library — Validates: FR-006
