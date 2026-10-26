# AGENTS — @stackra/events

Event and listener kind bases, the in-process bus and the event testing helpers. Member at
`packages/foundation/events` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./testing`.

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
- An event holds its payload only; metadata travels in `RecordedEvent`. No constructor-made state on events or on
  aggregates (recording is a WeakMap beside the aggregate).
- Never import `@stackra/outbox`, `@stackra/analytics`, `@stackra/integrations` or `@stackra/realtime`; they import
  this package. `drainOutbox` works through `OutboxFake`.
- The source keeps to erasable syntax: no parameter properties, no `#private` fields (the fake is a proxy).

## PII

| Data          | Where                             | Handling                                                                                 |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| Event payload | `RecordedEvent`, the outbox drain | Whatever the producer declares; mark personal fields `@Classified`. Stored nowhere here. |
