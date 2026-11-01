# Bug Specification: drainOutbox delivers like the inbox

**Feature Branch**: `figentra/sta-1789-drain-outbox-scope`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1789

**Clarifications status**: complete

**Input**: Leader, for 0.2.2 (2026-11-01). In production `InboxService.receive` runs each event in its own transaction,
as the envelope's actor in its scope (through `CallIsolation`, or `withScope` without it). The testing `drainOutbox()`
delivers with neither, so a listener test finds no tenant-owned rows and its writes are dropped (figentra/billing#2 and
#4; #4's usage listener cannot be wrapped by hand, since the drain carries no tenant).

## Impact

- **Apps touched**: none
- **Services touched**: none in core (billing#2 and #4 drop their wrappers)
- **Packages touched**: `packages/foundation/events` (testing entry: `commitEvents` records the call's actor and scope,
  `drainOutbox` delivers one event at a time through a registered delivery scope, `deliverEventsIn`);
  `packages/data/database` (testing entry: registers the delivery scope, passes the running call to `commitEvents`)
- **Cross-service events**: none
- **Tenancy and data**: tests only; delivery now holds the same isolation as production
- **Secrets**: none
- **ADR needed**: no (ADR 0269 decision 3: test helpers behave as production)
- **New dependencies**: none (both packages already depend on what they use)
- **Deploy modes**: test tier only
- **Licence tier**: free
- **Docs to update**: events and database READMEs
- **Lane**: bug
- **Change risk**: R2 (every listener test that drains now runs in a transaction and the event's scope)

## Requirements

- **FR-001** `commitEvents(events, call?)` writes each integration event's meta with the call's actor, `correlationId`
  (the call id) and `scopeId`, and remembers the call's `ScopeRef` by event id, as production's outbox writer records
  the actor, call and the writing transaction's scope.
- **FR-002** `drainOutbox()` delivers each event on its own, through the delivery scope `deliverEventsIn` registered,
  with the event's meta and recorded scope; without one it delivers as before.
- **FR-003** `@stackra/database`'s testing entry registers a delivery scope that runs each delivery in a new
  transaction as the event's actor in its scope (`CallIsolation` when the app binds it, else `withScope`), the platform
  actor when the event has none: the inbox's rule.
- **FR-004** Tests: `commitEvents` writes the call's actor, id and scope; `drainOutbox()` runs each event through the
  delivery scope with its meta and scope; the database's delivery scope opens a new transaction as the event's actor in
  its scope, the platform for an event with none, and `withScope` without an isolation.

## Status history

- 2026-11-01 → Clarified (leader's 0.2.2 item)
