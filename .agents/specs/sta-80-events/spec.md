# Feature Specification: @stackra/events core, the in-process bus, @OnEvent, sources and sinks

**Feature Branch**: `figentra/sta-80-events-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-80

**Linear project**: Foundation kernel (W1.3, STA-54)

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Draft the specify-stage spec for `packages/foundation/events` (roadmap W1.3, STA-80), the core of the
messaging layer: the in-process bus, `@OnEvent`, source and sink contracts and the BroadcastChannel sink, ported and adapted
from Figentra OS `@figentra-os/events`. Outbox wiring lands in W4.1 (ADR 0078)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/events (new). Later consumers, not changed here: runtime/outbox (W4.1), runtime/queue, runtime/realtime, communication/webhooks, state/coordinator
- **Cross-service events**: none. This package is the mechanism; it defines no event type. Integration events leave through `@stackra/outbox` (W4.1), not through this package (ADR 0078 decision 3)
- **Tenancy and data**: none. No table; the bus holds nothing durable. A scope id may travel in envelope metadata, but the package makes no tenancy decision
- **Secrets**: none
- **ADR needed**: no (ADR 0078 decides the layer; 0094 and 0117 bound it)
- **New dependencies**: none (depends on workspace packages `@stackra/container` and `@stackra/contracts` only)
- **Deploy modes**: same in all three. Pure in-process code; the BroadcastChannel driver is a browser and runtime API with no outbound network; no package calls home (ADR 0076 decisions 2 and 3)
- **Lane**: full (roadmap W1.3)
- **Change risk**: R2 (a new package with a public contract other packages build on)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Emit a typed event and react to it in-process (Priority: P1)

A package author declares event types by augmenting the `EventMap` in their own `./contracts` entry, emits
`bus.emit("ticket.created", { id })`, and another class reacts with `@OnEvent("ticket.created")`. Payloads are type-checked at
both ends. One failing listener never stops the others or the emitter (ADR 0078 decisions 1 and 2).

**Why this priority**: "Something happened. Who reacts?" is the question every other messaging package builds on.

**Independent Test**: A test module with two `@OnEvent` providers, one of which throws, receives one emit; the healthy
listener runs and the failure is reported to the logger port.

**Acceptance Scenarios**:

1. **Given** a provider with `@OnEvent("ticket.created")`, **When** the module initialises and `ticket.created` is emitted, **Then** the method runs once with the envelope.
2. **Given** listeners with priorities 10 and 1, **When** an event is emitted, **Then** priority 10 runs first; equal priorities run in subscription order.
3. **Given** one listener throws, **When** `emitAsync` runs, **Then** it resolves with `{ delivered, failures }` and the error goes to the logger, never to the emitter.
4. **Given** a pattern `ticket.*`, **When** `ticket.closed` is emitted, **Then** the pattern listener runs; `ticket.comment.added` needs `ticket.**`.

---

### User Story 2 - Emit only after the transaction commits (Priority: P1)

A service author collects events in a deferred buffer while a unit of work runs, and flushes it on success or discards it on
failure. The deferred buffer is ported from `@figentra-os/events`; ADR 0078 does not decide it. It complements the outbox,
which makes cross-service delivery durable by writing the event row in the same transaction as the state change (ADR 0078
decision 4).

**Why this priority**: Without it, listeners react to changes that were rolled back.

**Independent Test**: A deferred buffer gets two emits; `discard()` delivers none, `flush()` delivers both in order with their original times.

**Acceptance Scenarios**:

1. **Given** a deferred buffer with two events, **When** `flush()` runs, **Then** listeners receive both in emit order.
2. **Given** a deferred buffer, **When** `discard()` runs, **Then** no listener runs.
3. **Given** two concurrent requests, **When** each takes a deferred buffer, **Then** the buffers are never shared.

---

### User Story 3 - Bring external events in and send local events out through sources and sinks (Priority: P2)

A package author registers an `EventSource` or `EventSink` driver. External events enter only through a source that maps each
external type to a local type with a schema (or an explicit allow list), and leave only through a sink that matches patterns.
Nothing is forwarded automatically (ADR 0078 decision 2).

**Why this priority**: Realtime, webhooks, the inbox and cross-tab coordination all plug in here.

**Independent Test**: A fake source delivers a mapped message, an unmapped message and an invalid one; only the mapped one is
emitted, marked remote. A fake sink receives local envelopes matching its pattern and never a remote one.

**Acceptance Scenarios**:

1. **Given** a source mapping `ext.ticket` to `ticket.updated` with a schema, **When** a valid message arrives, **Then** `ticket.updated` is emitted with `source: "remote"` and the sender's origin.
2. **Given** the same source, **When** an unmapped or invalid message arrives, **Then** it is rejected with a reported reason and never emitted.
3. **Given** a sink for `ticket.*`, **When** a remote `ticket.updated` is emitted locally, **Then** the sink does not receive it (no echo loop).
4. **Given** two sources with the same name, **When** the module initialises, **Then** it fails with an STK duplicate-endpoint error.

---

### User Story 4 - Share events across browser tabs (Priority: P2)

An app registers the BroadcastChannel source and sink on a shared channel name. An event emitted in one tab reaches listeners
in the other tabs, and a tab ignores its own messages (roadmap W1.3 "Done when"; reused by `@stackra/coordinator`, roadmap W7).

**Independent Test**: Two buses joined by an in-memory channel hub exchange one event each way, without echo.

**Acceptance Scenarios**:

1. **Given** two buses on channel `app`, **When** bus A emits `cart.updated`, **Then** bus B's listener receives it marked remote, and bus A's sink does not re-send it.

---

### User Story 5 - Scoped buses that bubble (Priority: P3)

With scoped mode on, each container scope gets a child bus whose emits run its own listeners and then bubble to the root, unless
emitted `local`. Scoped `@OnEvent` providers are bound per scope.

**Independent Test**: A scoped emit reaches scope listeners and then root listeners with `bubbled = true`; a `local` emit stops at the scope.

**Acceptance Scenarios**:

1. **Given** scoped mode, **When** a scope emits `x`, **Then** root listeners see it with the scope id in metadata.
2. **Given** a scope is disposed, **When** it is disposed, **Then** its bus and listeners are released.

---

### User Story 6 - Consume events as a stream and test them (Priority: P3)

An author iterates `bus.stream("ticket.*")` with an abort signal, or records the last N envelopes for replay; a test author uses
the testing entry (`createTestBus`, `recordEvents`, `expectEmitted`, `fakeSource`, `fakeSink`).

**Independent Test**: A stream with a buffer of 2 receives 3 fast events, drops the oldest and reports the drop once.

### Edge Cases

- A `once` listener is removed before it runs, so a re-entrant emit does not call it twice.
- A listener subscribed during an emit does not receive that emit.
- An abort signal already aborted at subscribe time subscribes nothing.
- Emitting after the bus is disposed is a no-op that reports once, never a throw.
- A source message that cannot be decoded is rejected as `undecodable`.
- An integration event name without a `.v<n>` suffix on a sink meant for cross-service delivery is rejected (ADR 0078 Enforcement; the sink itself ships in W4.1).
- A package that injects the bus but runs without the events module falls back to a no-op bus.

## Requirements _(mandatory)_

### Functional Requirements

EARS wording (ADR 0120 D18).

- **FR-001**: The package shall provide one in-process event bus with `emit`, `emitAsync`, `on`, `once`, `off` by abort signal or returned function, and `pending()`, ported from `@figentra-os/events` and adapted to Stackra names (ADR 0078 decision 2, ADR 0084).
- **FR-002**: Event types shall be declared by augmenting an `EventMap` interface in the declaring package's `./contracts` entry, so payloads are type-checked at emit and listen (ADR 0117 decision 2).
- **FR-003**: The bus shall support exact names and wildcard patterns (`*` one segment, `**` one or more).
- **FR-004**: When an event is emitted, the bus shall call listeners in priority order, then subscription order, across exact and wildcard listeners.
- **FR-005**: If a listener throws or rejects, then the bus shall report the failure through the logger port and continue with the remaining listeners; `emit` shall never throw a listener's error.
- **FR-006**: The package shall provide `@OnEvent(pattern, options)` as a legacy decorator on provider methods, discovered through the `@stackra/container` metadata store and bound at module init and unbound at destroy; there shall be no `define*()` API and no `reflect-metadata` (ADR 0094 decisions 1 and 5, ADR 0005).
- **FR-007**: `@OnEvent` shall be the one way to handle every source the same way: in-process, between services, inbound webhooks and client transports (ADR 0078 decision 2).
- **FR-008**: The package shall provide a deferred emitter that buffers emits and delivers them on `flush()` in order with their original times, or drops them on `discard()`; each call shall return a new buffer.
- **FR-009**: The package shall define `EventSource` and `EventSink` contracts and register drivers through multi-providers or `@EventSource(name)` / `@EventSink(name)`; an endpoint registry shall connect sinks then sources at init and disconnect them at destroy (ADR 0078 decision 2; driver pattern, owner decision Round 8).
- **FR-010**: A source shall emit an external message only when its type is mapped with a schema or listed in an allow list; otherwise it shall reject it with a reason (`unmapped`, `invalid`, `undecodable`) and report it. Source schemas shall be Standard Schema compatible so `@stackra/validation` Zod schemas plug in.
- **FR-011**: A source shall mark emitted envelopes remote with the sender's origin and ignore messages from its own origin; a sink shall receive only local envelopes matching its patterns.
- **FR-012**: The package shall ship a BroadcastChannel source and sink.
- **FR-013**: The package shall distinguish domain events, which stay in-process and are unversioned, from integration events, which are named `<aggregate>.<verb>.v<n>` and carry shapes from the producer's `./contracts` (ADR 0078 decision 3, constitution http-and-events) [NEEDS CLARIFICATION: C27 — proposed: no service prefix in integration event names; envelope fields beyond the actor settled in `@stackra/contracts`].
- **FR-014**: The package shall not publish integration events to a broker itself; the durable cross-service path is a sink supplied by `@stackra/outbox` and an inbound source supplied by its inbox (ADR 0078 decisions 3 and 4; roadmap W4.1).
- **FR-015**: The cross-service envelope shall be `EventEnvelope` from `@stackra/contracts`, whose `actor` is the action pipeline's actor with its `onBehalfOf` chain (ADR 0117 decision 1, ADR 0098) [NEEDS CLARIFICATION: C27 — proposed: the in-process envelope `{ type, payload, meta }` maps one-to-one onto `EventEnvelope` at the outbox sink].
- **FR-016**: The package shall not import `encore.dev`; any broker adapter is duck-typed and passed in by gen (ADR 0078 decision 8, ADR 0124 decision 3).
- **FR-017**: Where scoped mode is on, the module shall give each container scope a child bus that bubbles emits to the root unless emitted local, and shall bind scoped `@OnEvent` providers per scope.
- **FR-018**: The bus shall offer `stream(pattern, { signal, buffer })` as an `AsyncIterable` with a bounded buffer that drops the oldest envelope and reports the drop, and `record({ size, patterns })` for replay.
- **FR-019**: The package shall ship a testing entry: `createTestBus`, `recordEvents`, `expectEmitted`, `fakeSource`, `fakeSink`, `flushBus`.
- **FR-020**: Every error the package raises shall carry an STK code (owner decision X3).
- **FR-021**: The package shall publish a types-only `./contracts` entry (`EventMap`, pattern and envelope types, bus, source and sink interfaces, tokens, the error shape) with no runtime imports (ADR 0117 decision 2).
- **FR-022**: Every source and sink driver shall pass one conformance suite, run in the air-gapped CI job (ADR 0076 decisions 5 and 6, ADR 0078 Enforcement).
- **FR-023**: The package's entries and layout shall follow the layout chosen for every package [NEEDS CLARIFICATION: FW1 — recommended: (a) entries first: `contracts`, `core`, `testing` now; `react`, `native`, `node`, `devtools` added when their consumers land].

### Key Entities

- **Event envelope**: `{ type, payload, meta: { id, time, source, origin?, correlationId?, scope?, bubbled? } }` in-process; `EventEnvelope` across services.
- **EventMap**: the augmentable interface that maps event names to payload types.
- **Listener**: a function or `@OnEvent` method with a pattern, priority and once flag.
- **Source / Sink**: named drivers through which events enter and leave; the only doors.
- **Deferred buffer**: an emit buffer flushed after commit or discarded on rollback.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The ported test suite of `@figentra-os/events` for the core entry passes under the Stackra names, plus a test per FR above.
- **SC-002**: The source and sink conformance suite passes for the BroadcastChannel and fake drivers with outbound network blocked.
- **SC-003**: A listener failure never reaches the emitter, shown by a test with a throwing and a rejecting listener.
- **SC-004**: The package has no runtime dependency other than `@stackra/container` and `@stackra/contracts`, checked by knip and boundaries.
- **SC-005**: `pnpm verify` is green with the package added.

## Glossary

- **Domain event**: a fact inside one service; in-process, unversioned.
- **Integration event**: a fact another service needs; versioned by name (`user.created.v1`), sent through the outbox, received through the inbox.
- **Source**: a driver that turns external messages into local events after mapping and validation.
- **Sink**: a driver that sends local events that match its patterns to an external transport.
- **Origin**: the identity of a bus instance, used to drop echoed messages.
- **Deferred emission**: emits held until a unit of work commits.
- **Bubbling**: a scoped bus re-emitting its events on the root bus.

## Assumptions

- `@stackra/container`, `@stackra/contracts` and `@stackra/logger` (W1.1, W1.2) are merged before the plan starts; the logger is a port, so the logger package is optional at runtime.
- The Figentra OS code is relicensed to MIT on port (owner decision, 2026-10-19).
- React, React Native, node broker and devtools entries of the Figentra package are out of scope here; they are added with their consumers (W4.1 outbox, W7 client) under the same contracts.
- SSE and WebSocket sources and sinks may be ported in this package or moved to `@stackra/realtime`; the plan decides by the FW1 layout.

## Open items

- [NEEDS CLARIFICATION: C27 — proposed: integration event names carry no service prefix; envelope fields beyond the actor are fixed in `@stackra/contracts`; in-process envelope maps one-to-one onto `EventEnvelope`]
- [NEEDS CLARIFICATION: FW1 — recommended: (a) entries-first package layout]
