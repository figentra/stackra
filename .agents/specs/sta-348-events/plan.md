# Plan: `@stackra/events` wave 2

**Spec**: `.agents/specs/sta-348-events/spec.md`

## Design

- `Event` is the abstract shared base with a typed static `create(values)` that parses through `schemaOf(this)` and
  freezes; no constructor state, the `~kind` brand is protected and type-only.
- `IntegrationEvent`, `WebhookEvent`, `AnalyticsEvent` and the called `Listener` are built with container's
  `createKind(code, Base, read)`; each `read` checks the options and applies defaults, which the kind registry keeps.
  `DomainEvent` is bare-only: `registerKind(DomainEvent, "domain_event")`.
- `BroadcastAudience` is `Enum.of` (`principal`, `tenant`).
- Recording is a WeakMap beside the aggregate (`recordEvent`, `takeRecordedEvents`).
- `registerListeners` fills a module-level registry; `EventBus#connect(container)` subscribes the listeners the
  container binds. `EventBus` (a `Service` on the `Clock` port) queues occurrences, drains them to subscribers,
  isolates failures and keeps the published log and delivery history.
- `./contracts`: `EventOutbox extends Port` with `write(records)`; `EventMeta` maps onto the ADR 0141 envelope.
- `./testing`: a testing-module plugin builds a harness per compiled app (bus, outbox, inbox, seen ids) and adds
  `app.events` and `app.listeners`; `dispatch`, `drainEvents`, `drainOutbox` and `deliverRemoteEvent` act on the
  current harness; `OutboxFake` is `Fake.of(EventOutbox)`; `toEmit` and `toRecord` are `createMatcher` matchers.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`; `@stackra/testing` is
  an optional peer; `./contracts` is a leaf; `./testing` imports `.` and `./contracts` only.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; event names dotted snake_case; kind codes snake_case.
- No parameter properties and no `#private` fields.
