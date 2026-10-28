# AGENTS — @stackra/analytics

Product analytics delivery behind consent, with a bounded pre-consent queue (ADR 0298). Member at
`packages/cross-cutting/analytics` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./react`, `./native`, `./testing`.

## Where code goes

| You are writing…                      | It goes in…                                     |
| ------------------------------------- | ----------------------------------------------- |
| The configuration (`AnalyticsConfig`) | `src/config/analytics.config.ts`                |
| Its shape and shipped `X$`            | `src/core/schemas/`, `src/core/constants/`      |
| The port and the delivery type        | `src/contracts/{ports,types}/`                  |
| A driver a host selects               | `src/core/drivers/<name>-analytics.driver.ts`   |
| A React Native driver                 | `src/native/drivers/<name>-analytics.driver.ts` |
| The delivery service                  | `src/core/services/analytics-client.service.ts` |
| The delivery id maker                 | `src/core/functions/analytics-id.function.ts`   |
| React code                            | `src/react/analytics/`                          |
| A test helper                         | `src/testing/`, `src/testing/functions/`        |
| A test                                | `__tests__/<name>.<kind>.test.ts(x)` beside it  |

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
  client makes `anonymousId` and `sessionId` only once consent allows a send, holds them in memory and never stores
  them; a driver sends the envelope's ids and never makes its own. `context.page` is the path only, never the query.
- `AnalyticsDelivery` is the shape every driver, the Pro destinations included, implements against: a field change is a
  port change and updates `contracts/__tests__/index.test.ts` and the README envelope table in the same commit.
- Production code never imports `./testing`; a driver a host can select ships in `.` (or `./native`).
- `AnalyticsEvent` belongs to `@stackra/events`; never redefine it here.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

| Data           | Where                    | Handling                                                                  |
| -------------- | ------------------------ | ------------------------------------------------------------------------- |
| Event payloads | the queue, then a driver | schema-declared fields only, deny list removed, held in memory until sent |
| Secrets        | none                     | `posthogKey` is a public project key, fed from the host's env config      |
