# Feature Specification: `@stackra/events` wave 2, event and listener kinds, the bus and the event test kit

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/events` (foundation, wave 2) for real: the abstract `Event` base, the `DomainEvent`,
`IntegrationEvent`, `WebhookEvent` and `AnalyticsEvent` kind bases, the `Listener` kind base, the in-process bus,
recording kept off the aggregate, the `EventOutbox` port and the `./testing` helpers.

## Impact

- **Apps touched**: none (the template's apps consume `AnalyticsEvent`; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/foundation/events` (new member)
- **Cross-service events**: none emitted; this package defines how they are declared
- **Tenancy and data**: none (an occurrence carries a tenant id in its metadata; the package stores nothing durable)
- **Secrets**: none
- **ADR needed**: no (ADR 0078, 0141 with its 2026-10-23 note, 0294 decisions 4, 15, 16, 20, 25 and 27 and amendment
  items 5 and 7, 0305 rules 2, 19 to 21, 0308 rules 15 and 16, 0269 decision 3, 0127 2026-10-24 note)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation` through
  `workspace:*`; `@stackra/testing` as an optional peer; `zod` (catalog) for tests only
- **Deploy modes**: same in all; isomorphic core, `./testing` node only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/events/README.md`, `packages/foundation/events/AGENTS.md`; ADR 0078, 0120, 0127, 0141, 0269, 0294, 0305, 0308 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every service declares events and listeners through it; a wrong option default or a listener
  failure leaking to the emitter is a contract defect)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: `AnalyticsEvent` lives in events, delivery stays in analytics
  (ADR 0305 rule 20); `drainOutbox` works through a port fake, with no dependency on `@stackra/outbox`; extra entries fold
  into the standard six

## User Scenarios & Testing

### User Story 1 - Declare an event (Priority: P1)

An author writes `class OrderPaid extends IntegrationEvent({ name: "order.paid", broadcast: { permission, audience:
BroadcastAudience.Tenant } })`, `class PointsRedeemed extends DomainEvent`, `class InboundMailReceived extends
WebhookEvent<ResendIntegration>({ type: "email.received" })` and `class LeadSubmitted extends AnalyticsEvent({ name:
"lead.submitted" })`, and builds each with `X.create({...})`.

**Independent Test**: `src/core/bases/__tests__/*.test.ts`, `src/core/enums/__tests__/broadcast-audience.enum.test.ts`,
`src/core/constants/__tests__/event-name-pattern.constant.test.ts`.

**Acceptance Scenarios**:

1. **Given** `IntegrationEvent`, **When** called, **Then** the kind registry holds `integration_event` with `version: 1`,
   `webhook: false` and, when broadcast is set, audience `principal` by default; a name that is not dotted snake_case,
   a version below 1 or an unknown audience throws.
2. **Given** `DomainEvent`, **When** extended bare, **Then** its subclasses are `domain_event` and take no options.
3. **Given** `WebhookEvent<I>` and `AnalyticsEvent`, **When** called, **Then** a missing `type` or a bad `name` throws.
4. **Given** any event class with a registered schema, **When** `X.create(values)` runs, **Then** the result is a
   frozen instance of `X` with the schema's defaults applied; without a schema it throws `TypeError`.

### User Story 2 - React to an event (Priority: P1)

An author writes `class MarkOrderPaidListener extends Listener` (in process) or `extends Listener({ queue })` with
`async handle(event: PaymentCaptured, ctx: ListenerContext)`, reading `ctx.now()`, `ctx.eventId` and
`ctx.connection`.

**Independent Test**: `src/core/bases/__tests__/listener.base.test.ts`,
`src/core/functions/__tests__/register-listeners.function.test.ts`, `src/core/services/__tests__/event-bus.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** registered pairs and a container, **When** `bus.connect(container)` and `bus.drain()` run, **Then** each
   queued event reaches every subscribed listener in order, including events dispatched during the drain.
2. **Given** a listener that throws, **When** drained, **Then** the delivery records the error and the other listeners
   still run; `drain()` never rejects.
3. **Given** `Listener({ queue: "" })` or `retry.attempts < 1`, **Then** it throws.

### User Story 3 - Record events at commit (Priority: P1)

A model's `record(event)` calls `recordEvent(aggregate, event)`; the unit of work calls `takeRecordedEvents(aggregate)`
and writes integration events through the `EventOutbox` port.

**Independent Test**: `src/core/functions/__tests__/record-event.function.test.ts`,
`src/core/functions/__tests__/take-recorded-events.function.test.ts`, `src/contracts/ports/__tests__/event-outbox.port.test.ts`.

**Acceptance Scenarios**:

1. **Given** two recorded events, **When** taken, **Then** they come back in order and a second take is empty; the
   aggregate gains no own property.

### User Story 4 - Prove events in a test (Priority: P1)

Template tests write `await dispatch(X.create(...)); await drainEvents();`, `await deliverRemoteEvent(X, fields);
await drainOutbox();`, `app.events.published().ofType(X)`, `app.listeners.calls(L)` / `.failures(L)`,
`expect(accounts).toEmit(X, fields)` and `expect(result).toRecord(X, fields)` on a list or a `run()` result.

**Independent Test**: `src/testing/**/__tests__/*.test.ts`.

**Acceptance Scenarios**:

1. **Given** a compiled testing app, **When** `drainOutbox()` runs, **Then** what the `OutboxFake` holds and what the
   inbox received is delivered once per id, until nothing is left; an app with another outbox driver is refused.
2. **Given** no compiled app, **When** a helper runs, **Then** it throws a clear error.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./testing` only (ADR 0294 d15, ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports `AnalyticsEvent`, `BroadcastAudience`, `DomainEvent`, `IntegrationEvent`, `Listener`,
  `ListenerContext` (type), `WebhookEvent` (template), and `Event`, `EventBus`, `recordEvent`, `takeRecordedEvents`,
  `registerListeners` and the option types (registry row).
- **FR-003**: `./contracts` exports `EventOutbox`, `EventMeta`, `RecordedEvent`; `.` does not.
- **FR-004**: `./testing` exports `deliverRemoteEvent`, `dispatch`, `drainEvents`, `drainOutbox` (template), and
  `OutboxFake`, `toEmit`, `toRecord`, `PublishedEvents`, `EVENTS_TESTING_PLUGIN`.
- **FR-005**: An event instance holds its payload only; metadata travels in `RecordedEvent` (ADR 0294 d27).
- **FR-006**: No dependency on `@stackra/outbox`, `@stackra/analytics`, `@stackra/integrations` or `@stackra/realtime`.
- **FR-007**: A listener failure never reaches the emitter or the other listeners (ADR 0078).

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/events` and `@stackra/events/testing` exists with the
  shape the template uses.
- **SC-002**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-003**: The kind registry records each event kind's options with their defaults; the tests prove it.

## Notes

- The registry row lists `errors` as a dependency; nothing here raises a refusal (option mistakes are programmer
  errors, `TypeError`/`RangeError`), so the dependency is not declared until a refusal is needed.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
