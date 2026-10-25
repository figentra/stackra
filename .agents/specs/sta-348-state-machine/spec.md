# Feature Specification: `@stackra/state-machine` wave 4, the StateMachine kind and `@Transition`

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing (data gate: merges only after the owner's model review)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/state-machine` (data, wave 4) for real: a class that extends
`StateMachine<Order>({ field: "status" })` governs one field of its model; each method decorated with
`@Transition({ from, to })` is a transition the caller invokes directly (`this.lifecycle.cancel(order, reason)`).

## Impact

- **Apps touched**: none (server only, like models)
- **Services touched**: none here (the template's commerce service imports from `.` already)
- **Packages touched**: `packages/data/state-machine` (new member)
- **Cross-service events**: none. The history is a `StateTransitioned` domain event recorded on the record, so it is
  dispatched in process after commit and never written to the outbox
- **Tenancy and data**: no tables of its own; the audit log persists history through a listener
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none outside the workspace and catalogs (`zod` is already `catalog:`); `@stackra/container`,
  `@stackra/contracts`, `@stackra/errors`, `@stackra/events`, `@stackra/model` and `@stackra/validation` through
  `workspace:*`
- **Deploy modes**: same in all; no outbound call
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/state-machine/README.md`, `packages/data/state-machine/AGENTS.md`; ADR 0120, 0161, 0227, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every governed field's writes go through it)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entry `.` only, exports `StateMachine` and `Transition`, depends on `model` and `events`;
  ADR 0161 with its 0294 note; ADR 0305 rule 5 (partner as type argument: `StateMachine<Order>({ field })`); ADR 0294
  decisions 6, 16 and 25; no XState, ADR 0227
- The partner is a real `Model` (`M extends Model`, from `@stackra/model`), and `field` accepts only a field typed as a
  closed set of codes (`StateField<M>`): a plain `string` or a `PublicId` is refused by the compiler
- A transition's condition is its precondition: the record is in a `from` state. Nothing is named Guard or Gate (ADR
  0294 decision 23, ADR 0161's 0294 note); the permission stays on the calling action
- The history is a `StateTransitioned` domain event recorded through the model's own `record`, after the body's events
- The refusal is `TransitionNotAllowedError`, kind `Conflict`, like the template's state refusal `OrderNotPayableError`

## User Scenarios & Testing

### User Story 1 - Declare and run a machine (Priority: P1)

`class OrderStateMachine extends StateMachine<Order>({ field: "status" })` with `@Transition({ from:
OrderStatus.PendingPayment, to: OrderStatus.Paid }) markPaid(order, paymentId, capturedAt)`.

**Independent Test**: `src/core/bases/__tests__/state-machine.base.test.ts`.

1. **Given** an order in `pending_payment`, **When** `markPaid(order, ...)` runs, **Then** the body runs with every
   argument, then `order.status` is `paid`, and the body's return value is returned.
2. **Given** an order in `paid`, **When** `cancel(order)` runs, **Then** `TransitionNotAllowedError`
   (`transition_not_allowed`, kind `Conflict`) is thrown, the body does not run and the status is unchanged.
3. **Given** a body that throws, **Then** the status is unchanged.
4. **Given** an async body, **Then** the status is written after it resolves, and stays when it rejects.
5. **Given** `from: [a, b]`, **Then** the transition runs from either state.

### User Story 2 - Ask before acting (Priority: P1)

`this.lifecycle.can(order, "cancel")` and `available(order)`; the transition name is typed from the class.

1. **Given** an order in `pending_payment`, **Then** `can(order, "cancel")` is true and `available(order)` lists
   `markPaid`, `cancel` and `expire`.
2. **Given** `can(order, "refund")` with no such transition, **Then** tsc refuses it.

### User Story 3 - History (Priority: P1)

Each transition records a `StateTransitioned` domain event on the record (machine, transition, field, from, to,
record id), unless the machine says `history: false`.

1. **Given** a transition, **Then** `takeRecordedEvents(order)` holds the body's own events, then the
   `StateTransitioned`.
2. **Given** `history: false`, **Then** nothing is recorded by the machine.

### User Story 4 - Mistakes surface early (Priority: P2)

1. **Given** `StateMachine({ field: "status" })` without a type argument, **Then** tsc shows the hint.
2. **Given** `StateMachine<Order>({ field: "" })`, **Then** a TypeError at class definition; `field: "note"` (a plain
   string) or `field: "id"` (a public id) fails to compile.
3. **Given** `@Transition` on a class that is not a state machine, or on a field, **Then** a TypeError at class
   definition (`createDecorator`).

## Requirements

- **FR-001**: Package `@stackra/state-machine` at `packages/data/state-machine`, entry `.` only, member files per ADR
  0294 R12.
- **FR-002**: Every symbol the template imports: `StateMachine`, `Transition`. Also public because a consumer needs
  them: `TransitionNotAllowedError` (callers and tests match the refusal), `StateTransitioned` (the audit listener's
  `handle` type), and the types `StateMachineOptions`, `TransitionOptions`, `TransitionName`, `StateField` and
  `StateMachineBase` (type only, so a consumer's declaration emit can name a machine's base).
- **FR-003**: `StateMachine` is a called-only kind base (`createKind`, kind `state_machine`) whose partner model is the
  type argument (`WithPartner`, `M extends Model`); options `{ field, history }`; inherited `can(record, name)` and
  `available(record)`.
- **FR-004**: `Transition` is made with `createDecorator` (method target, kind `state_machine`) and records metadata
  only; the base applies it when the machine is constructed (ADR 0294 decision 6: decorators record, the kind acts).
- **FR-005**: The check, the body and the write run synchronously in the caller's call, so they share its unit of work.
- **FR-006**: No XState and no other state-machine library (ADR 0161 d1, ADR 0227).

## Success Criteria

- **SC-001**: The template's `order.state-machine.ts`, `product.state-machine.ts` and the `can(...)` calls in the
  order policy, facts, service and archive action resolve against the package with the shape they use
  (`src/core/__tests__/index.test.ts` copies their declarations).
- **SC-002**: Every public symbol has a test beside it; lint and format pass.
- **SC-003**: Typecheck, tests and build pass in the separate testing workflow, after `pnpm install` links the member.

## Out of scope (named, not built)

- Timed transitions (ADR 0161 d5, the scheduler) and tenant customisation (d6): no consumer yet.
- The `state-field-write` lint and gen's state checks (STA-340); the Mermaid diagram (gen, from the manifest).
- Permissions per transition: a transition is reached through an action, which carries the permission (0161 note).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec, member files and code in wave 4 (owner mode 2026-10-24: develop now, test later)
