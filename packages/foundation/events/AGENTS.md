# AGENTS — @stackra/events

Event and listener kind bases, the in-process bus and the event testing helpers. Member at
`packages/foundation/events` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./devtools`, `./testing`.

## Where code goes

| You are writing…                        | It goes in…                                                     |
| --------------------------------------- | --------------------------------------------------------------- |
| A kind base                             | `src/core/bases/<name>.base.ts`                                 |
| A function, a type, a constant, an enum | `src/core/{functions,types,constants,enums}/`                   |
| A service                               | `src/core/services/<name>.service.ts`                           |
| A port or an occurrence type            | `src/contracts/{ports,types}/`                                  |
| A test helper, fake or matcher          | `src/testing/functions/`, `<name>.fake.ts`, `<name>.matcher.ts` |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it                     |

## Entries and barrels

- `src/{core,contracts,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every
  new public file to its barrel and to that entry's `index.test.ts`.
- `EventOutbox`, `EventMeta` and `RecordedEvent` are exported from `./contracts` only (ADR 0294 decision 15).
  `./contracts` imports no other entry; `./testing` imports `.` and `./contracts`.
- `./testing` registers the matchers and the testing-module plugin when imported; `sideEffects` stays `false`.

## This package

- A subscription is a class, never a wire name: `registerListeners` and `EventBus#subscribe` take any class, so a
  consumed service's generated event class (typed by its payload) stands beside a local one (ADR 0260 decision 4).
- `connect(container)` and `disconnect()` are called by the generated boot only (ADR 0263); `disconnect` removes the
  subscriptions `connect` made and nothing else.
- Listeners run after commit only (README "When a listener runs"): a domain event through the unit of work's dispatch
  and drain, an integration event (its own service's included) only through the outbox, the relay and the inbox. Never
  dispatch an integration event to the bus inside a transaction to make its listeners run sooner.
- Cross-region (STA-1268): `crossRegion: true` on a platform integration event only; `crossRegionRecords` refuses one
  that carries a tenant (ADR 0353 decision 5). `RegionBus` is a port in `./contracts`; its driver and the relay call
  live outside this package. A copy arrives through the receiving region's inbox and is never re-sent.
- An event holds its payload only; metadata travels in `RecordedEvent`. No constructor-made state on events or on
  aggregates (recording is a WeakMap beside the aggregate).
- Never import `@stackra/outbox`, `@stackra/analytics`, `@stackra/integrations` or `@stackra/realtime`; they import
  this package. `drainOutbox` works through `OutboxFake`.
- The source keeps to erasable syntax: no parameter properties, no `#private` fields (the fake is a proxy).

## Devtools

- `./devtools` is the dev-only devtools entry (ADR 0246 decision 4): `defineEventsDevtools(kit, bus)` defines `events.listeners` and `events.deliveries` on the kit, data only. No
  UI, no `@stackra-pro/*` import (ADR 0461: the panel UI is Pro, the data is free). Nothing in `.` or a production path
  imports `./devtools`.
- It takes the kit by shape, `DevtoolsTabSink` from `@stackra/container/devtools`, never `@stackra/devtools-kit`
  (the kit depends on container and events, so a dependency on it would close a cycle).
- Tab ids are dotted lowercase, `events.*` first. A tab that carries inputs, payloads or personal data sets
  `sensitive: true`.
- ADR 0127 does not list `./devtools` among the allowed entries and gen's `entryOf` does not know it yet; the barrel
  is a hand-written stand-in until both are settled (see the stackra-208 hand-off).

## PII

| Data          | Where                             | Handling                                                                                 |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| Event payload | `RecordedEvent`, the outbox drain | Whatever the producer declares; mark personal fields `@Classified`. Stored nowhere here. |
