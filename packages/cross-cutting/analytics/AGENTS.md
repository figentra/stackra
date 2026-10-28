# AGENTS — @stackra/analytics

Product analytics delivery behind consent, with a bounded pre-consent queue (ADR 0298). Member at
`packages/cross-cutting/analytics` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`, `./react`, `./native`, `./testing`.

## Where code goes

| You are writing…                      | It goes in…                                                 |
| ------------------------------------- | ----------------------------------------------------------- |
| The configuration (`AnalyticsConfig`) | `src/config/analytics.config.ts`                            |
| Its shape and shipped `X$`            | `src/core/schemas/`, `src/core/constants/`                  |
| The port and the delivery type        | `src/contracts/{ports,types}/`                              |
| A destination's shape                 | `src/core/types/analytics-destination.type.ts`              |
| A driver lookup driver                | `src/core/drivers/<name>-analytics-driver-lookup.driver.ts` |
| A driver a host selects               | `src/core/drivers/<name>-analytics.driver.ts`               |
| An identity driver                    | `src/core/drivers/<name>-analytics-identity.driver.ts`      |
| An offline queue driver               | `src/core/drivers/<name>-analytics-offline-queue.driver.ts` |
| A React Native driver                 | `src/native/drivers/<name>-analytics.driver.ts`             |
| The delivery service                  | `src/core/services/analytics-client.service.ts`             |
| The delivery id maker                 | `src/core/functions/analytics-id.function.ts`               |
| React code                            | `src/react/analytics/`, `src/react/autocapture/`            |
| A native hook                         | `src/native/analytics/`                                     |
| A built-in analytics event            | `src/core/analytics/<name>.analytics-event.ts`              |
| The server relay listener             | `src/node/listeners/`                                       |
| A test helper                         | `src/testing/`, `src/testing/functions/`                    |
| A test                                | `__tests__/<name>.<kind>.test.ts(x)` beside it              |

## Entries and barrels

- `src/{core,contracts,react,native,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `AnalyticsConfig$` mirrors `AnalyticsOptions` by hand until gen compiles this package's schemas; change both together.
  Every field keeps a default and no object-level refinement, so gen's override schema can `.extend` it.
- A new driver adds its name to `AnalyticsDriverName` and to the schema's `driver` enum in the same change.

## This package

- Consent is decided in `@stackra/consent`'s `ConsentLedger` only; this package reads it and never decides.
- Nothing leaves the device before the category is granted. Refusal discards the queue unsent. Loosening either is a
  privacy change and needs review.
- The gating category is never `necessary` (the schema refuses it).
- Only the event's schema-declared fields leave, minus `denyProperties`, in the `AnalyticsDelivery` envelope (v2). The
  client makes (or restores) `anonymousId` and makes `sessionId` only once consent allows a send; a driver sends the
  envelope's ids and never makes its own.
- Identity (`identify`, `group`, `reset`): the `AnalyticsIdentity` driver is written only by the client, only while the
  category is granted, and cleared on refusal or `reset`; the session id is never kept. `userId` is a public id, never a
  contact field, and the identity record holds ids only. `identify` and `group` are deliveries (`kind`), gated and
  queued like events; a driver that cannot stitch drops them instead of recording them as events. `context.page` is the path only, never the query.
- `AnalyticsDelivery` is the shape every driver, the Pro destinations included, implements against: a field change is a
  port change and updates `contracts/__tests__/index.test.ts` and the README envelope table in the same commit.
- The delivery engine is the client's: batching, retries (`backoffDelay` from @stackra/contracts, never a local
  formula), sampling and the offline queue. A driver sends once and rejects on failure; never add a retry loop to a
  driver (the native PostHog buffer resolves once it holds the events, so the client never resends them). Only
  deliveries that passed consent reach the buffer or the offline queue, and a refusal clears both.
- Destinations (stackra-407): each destination is a lane in the client with its own consent category, routing,
  queue, buffer and retries; never let one lane's consent or failure reach another. Every lane shares the event id
  and visitor ids. The identity store follows `consentCategory` only. `include`/`exclude` route tracked events only;
  `identify` and `group` go to every granted lane.
- Auto-capture (stackra-409) sends a path without query or hash, a route name without params, and a `data-track`
  name only; never read element text, values or other attributes. Web vitals and replay belong to `TelemetryConfig`;
  never add them back here.
- Production code never imports `./testing`; a driver a host can select ships in `.` (or `./native`).
- `AnalyticsEvent` belongs to `@stackra/events`; never redefine it here.
- Server analytics (`./node`): `RelayTrackedAnalyticsListener` sends `@stackra/actions`' `AnalyticsTracked` as it is,
  minus `denyProperties`. Consent was decided by the pipeline when the event was written (a verified snapshot granting
  `analytics`); the relay never sends anything the event does not hold and never retries itself (the outbox does).
  Only `./node` imports `@stackra/actions`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

| Data           | Where                    | Handling                                                                                      |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| Event payloads | the queue, then a driver | schema-declared fields only, deny list removed, held in memory until sent                     |
| Kept batches   | the offline queue driver | only after consent; bounded by `offlineLimit`; cleared on refusal; checked by schema on load  |
| Visitor ids    | the identity driver      | anonymous id, user public id, group ids; kept only after consent, cleared on refusal or reset |
| Secrets        | none                     | `posthogKey` is a public project key, fed from the host's env config                          |
