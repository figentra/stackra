# @stackra/events

## 0.33.0

### Patch Changes

- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [93d63bb]
  - @stackra/contracts@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- @stackra/testing@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0
  - @stackra/container@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b4b6422]
  - @stackra/container@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/testing@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/testing@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- @stackra/testing@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/testing@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/testing@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- @stackra/testing@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- acbee14: The events testing plugin offers `OutboxFake` as `EventOutbox`'s `memory` test driver. Since gen binds the real outbox
  for the action pipeline (#706), a `createTestingModule(...).useDrivers("memory")` app bound `OutboxEventOutboxDriver`,
  so `drainOutbox()` threw and `toRecord` and `app.events.published()` saw nothing. Under `memory` the fake is bound
  again. An explicit `.override(EventOutbox, …)` still wins, and a container that doesn't pick `memory` keeps the real
  outbox, as production wiring does.
- @stackra/testing@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/container@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/container@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/testing@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/testing@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/testing@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/testing@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/testing@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/testing@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/testing@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/testing@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/testing@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/testing@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/testing@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/testing@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/testing@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/testing@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/testing@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/testing@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/testing@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- @stackra/testing@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/testing@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/testing@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- 5fc0db7: Listeners are audited like actions. With a bound `ListenerAuditTrail` (`@stackra/events/contracts`), every listener delivery that ended writes one entry: the system actor `sys_listener` that handled it, the event's id as correlation, the event's actor as `causedBy`, and what the listener added with the new `ctx.audit(fields)` (never a classified value), inside the delivery's transaction. `@stackra/actions` ships `OutboxListenerAuditTrailDriver`, which writes it as the same `audit_entry.recorded` event an action call's entry is (`key: listener:<Listener>`).

### Patch Changes

- 90f55b1: A model's recorded events reach the testing app after commit (STA-1740). `MemoryDatabaseDriver` and `usePostgres()`
  connect `RecordedEventsSubscriber`, which takes each flushed model's recorded events and, once the outermost
  transaction commits, hands them to the new `commitEvents` of `@stackra/events/testing`: an integration event to the
  app's outbox, any other on its bus, so `run()` results and `app.events.published()` hold them. A rollback publishes
  nothing, and a released savepoint's events wait for the transaction around it. `@stackra/database` takes
  `@stackra/events` as an optional peer for its testing entry.
- 688cf0c: `drainOutbox()` delivers each event as the production inbox receives it once `@stackra/database`'s testing entry is
  loaded: on its own, in a new transaction, as the actor of the call that wrote it, in that call's scope (through the
  app's `CallIsolation`, or `withScope` without one), so listener tests over tenant-owned rows need no wrapper.
  `commitEvents(events, call)` records the call's actor, id and scope; `deliverEventsIn` registers the delivery scope
  (STA-1789).
- e219411: The events testing plugin connects only the listeners a testing app can build: one whose dependency nothing binds (a
  listener of a module the test did not boot, such as one needing `QueueService`) is skipped, and any other error
  building a listener still throws. The container throws a typed `UnboundTokenError` for a class nothing binds; its
  message is unchanged.
- 79dc807: The events testing plugin adds `app.listeners.skipped()`, the listeners it skipped because nothing binds a dependency, with the missing class.
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 0abe92d: A service's generated `#stackra/boot` now connects `EventBus` (when the service runs `@stackra/events` or
  `@stackra/outbox`) and `InboxService` (with `@stackra/outbox`) after the container is ready, and disconnects both
  when the shutdown signal aborts, so registered listeners, consumed-event subscribers and relays receive events. Add
  `EventBus#disconnect` (removes only the subscriptions `connect` made) and `InboxService#disconnect` (drops the relays).
- cc8db5e: Move the integration events' wire-name registry, `registerEventNames` and `EVENT_NAMES`, from `@stackra/outbox` down
  to `@stackra/events` (STA-1387). `@stackra/outbox` re-exports both, so its writers, inbox and existing callers are
  unchanged. Gen's `.stackra/gen/registrations.ts` now imports `registerEventNames` from `@stackra/events`, so a package
  below the outbox (`@stackra/actions`, with `AuditEntryRecorded` and `UsageRecorded`) registers its integration events
  without declaring `@stackra/outbox`, which would close a package cycle; gen no longer refuses it with
  `generated_dependency_missing`.
- e7a388a: Add the dev-only `./devtools` entry: `defineEventsDevtools(kit, bus)` defines the `events.listeners` (registered
  listener classes by event) and `events.deliveries` (each delivery by name, with its error message, no payload)
  devtools tabs (stackra-208, ADR 0246, ADR 0461).
- 2787c1e: Add `@stackra/events`, events and listeners of the programming model v3.1: the abstract `Event` base with a typed
  static `create`, the kind bases `DomainEvent` (bare), `IntegrationEvent({ name, version, webhook, broadcast })`,
  `WebhookEvent<I>({ type })` and `AnalyticsEvent({ name })`, `BroadcastAudience`, the `Listener` kind base in both forms
  with `ListenerContext`, `registerListeners`, the in-process `EventBus` that isolates listener failures, and recording
  kept off the aggregate (`recordEvent`, `takeRecordedEvents`); `./contracts` with the `EventOutbox` port, `EventMeta` and
  `RecordedEvent`; and `./testing` with `dispatch`, `drainEvents`, `drainOutbox`, `deliverRemoteEvent`, the `OutboxFake`,
  the `toEmit` and `toRecord` matchers and the testing-module plugin that adds `app.events` and `app.listeners`.
- 150fa18: `ListenerRetry` is removed: `Listener({ retry })` takes the contracts `RetryPolicy` (`backoff: Duration` became
  `base`). (stackra-223)
- 37e1aa8: Round D. search: synonym sets per index and language as settings data (`search.synonyms`), applied by both Postgres
  lanes; `find`/`page`/`facets` take `locale`. events: `IntegrationEvent({ crossRegion: true })`, the `RegionBus` port,
  `crossRegionRecords` and `RegionBusFake`. infra-gcp: static egress addresses (`shared.network.egress.staticIps`).
  versioning: deprecated dated versions are served until their support window ends (`VERSION_SUPPORT_MONTHS`), then
  refused; `applyVersionHeaders`. infra-tools:
  OCR and Photon images, tool databases and Valkey, Infisical secret sync, EBS-backed tools.

### Patch Changes

- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- d19a3d5: `newEventId` is `mintPublicId("evt")` (STA-1385): bus event ids now share the lowercase, time-ordered UUIDv7 form of
  action and outbox ids. Older uppercase ids stay valid, since ids compare as strings. The `PublicId` docblock now names
  `mintPublicId` as the one minter.
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
