# @stackra/analytics

## 0.1.0

### Minor Changes

- 072a443: Ad conversions on both sides with one dedup id. `@stackra/analytics` adds the `ad-pixel` driver of `AnalyticsDriver`
  (a destination gated by `marketing` that fires the tracked events `conversions` names on the new `AdPixel` port, with
  the `ref` property's value as the event id), the `none` `AdPixel` driver, the `conversions` and `adPixelDriver`
  settings, and `adClickIdOf` for the landing URL's ad click id. `@stackra/integrations` adds the conversion bridge:
  `Conversion` (payload paths), `conversionOf` and `ConversionBridge`, which send an integration event such as
  `order.placed` through `gateway.ads()` only when its consent grants `marketing`; `ConversionEvent` carries that consent
  and `AdPlatformConnector` an optional `phoneFormat`.
- f9093c1: Auto-capture: `useAutocapture(path)` (web) tracks `page.viewed` per path and `element.clicked` for `data-track`
  elements, and `useScreenViews(screen)` (native) tracks `screen.viewed`, as `autocapturePageviews` and
  `autocaptureClicks` switch them on. Breaking: `AnalyticsConfig.webVitals` and `sessionReplay` are removed;
  `TelemetryConfig.vitals` and `replay` (@stackra/logger) are their one owner.
- 31e1259: Delivery engine in `AnalyticsClient`: batches at `flushAt` or after `flushIntervalMs`, `flush()`, bounded retry
  with `backoffDelay` (`retryAttempts`, `retryBaseMs`, `retryMaxMs`, `bufferLimit`), per-visitor sampling
  (`sampleRate`, per-event `sampleRates`), the page-hide beacon (`AnalyticsDriver.beacon`, implemented by the PostHog
  driver with `navigator.sendBeacon`), and the optional `AnalyticsOfflineQueue` (`none`, `memory`, `storage` drivers;
  `offlineDriver`, `offlineLimit`) that keeps batches whose retries are spent for the next launch. Drivers no longer
  retry: the native PostHog driver's `send` resolves once its buffer holds the events.
- bdf1116: `AnalyticsDelivery` envelope v2: every delivery now carries `eventId` (`evt_` and a time-ordered Crockford id, for
  dedup across destinations), `anonymousId` and `sessionId` (made only after consent, held in memory for the launch),
  an optional `userId`, and an `AnalyticsContext` (library, page path, locale; screen, app version and region when set).
  The PostHog drivers send these ids instead of making their own. Drivers of `AnalyticsDriver` must accept the new
  fields.
- f3d2a51: Send analytics to several destinations: `drivers` names extra driver instances and `destinations` lists where
  deliveries go, each gated by its own consent category and routed by `include` and `exclude` event names, with its own
  queue, buffer and retries. Adds the `AnalyticsDriverLookup` port and its `none` driver.
- 6912039: Delivery follows the phone's power and data saving (STA-1536): while `SystemSettings` reports Low Power Mode or an
  expensive connection, a buffer ignores `flushAt` and waits four flush windows, leaving at once only at `bufferLimit`.
- 1d4bec6: Identity stitching: `AnalyticsClient.identify(userId)`, `group(type, id)` and `reset()`. Both calls are deliveries
  of their own `AnalyticsDeliveryKind` (`identify`, `group`), gated and queued like events; later events carry `userId`
  and `groups`. The new `AnalyticsIdentity` port keeps the anonymous id across launches only while consent holds, with
  `memory` (default), `cookie` and `storage` drivers and the `identityDriver`, `identityCookieName` and
  `identityExpiryDays` settings. The PostHog driver maps `identify` to `$identify` and `group` to `$groupidentify`, and
  sends an identified visitor's events as the user with a person profile.
- 2787c1e: Add `@stackra/analytics`, consent-gated product analytics delivery per ADR 0298: `AnalyticsClient.track` sends an `AnalyticsEvent` through the `AnalyticsDriver` port only once its consent category is granted, holds earlier events in a bounded ordered queue that is sent on acceptance and discarded on refusal, with `AnalyticsConfig` and its shipped schema, the `none` driver, `useAnalytics` and `fakeAnalytics`.
- b58ebce: Add the `posthog` analytics driver: `PosthogAnalyticsDriver` in `.` posts each send to PostHog's batch capture endpoint
  with plain `fetch`, behind the client's consent gate and bounded queue, with an in-memory anonymous id created only on
  the first send after consent and no person profile. Add `posthogKey` and `posthogHost` to `AnalyticsConfig`. Add the
  `./native` entry, whose `PosthogAnalyticsDriver` batches 20 events and flushes when React Native's `AppState` goes to
  the background (React Native is an optional peer). Move `MemoryAnalyticsDriver` from `./testing` to `.`, since gen's
  wiring offers it as a production driver and production code never imports `./testing`.
- 62a97c0: Add server analytics: `Action({ analytics })` and `Query({ analytics })` take `true` (the generic `action.called` event
  with key, outcome, duration and origin) or an `AnalyticsEvent` class (its declared fields from the output, then the
  input). The pipeline writes `AnalyticsTracked` (`analytics.tracked.v1`) through the outbox, in the unit of work for a
  successful action, only when the call's verified consent grants `analytics`. The new `@stackra/analytics/node` entry
  ships `RelayTrackedAnalyticsListener`, which sends each event to the bound `AnalyticsDriver` (stackra-410, STA-1512).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [fadd825]
- Updated dependencies [0c46afb]
- Updated dependencies [2787c1e]
- Updated dependencies [2e21e6a]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [0ee0d06]
- Updated dependencies [48e9fed]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [de4d77d]
- Updated dependencies [cc96d5d]
- Updated dependencies [d63f012]
- Updated dependencies [072dc7e]
- Updated dependencies [b58ebce]
- Updated dependencies [1723c05]
- Updated dependencies [d15a219]
- Updated dependencies [8ce76e9]
- Updated dependencies [c46f32f]
- Updated dependencies [2c2beca]
- Updated dependencies [9e63234]
- Updated dependencies [04a0f8c]
- Updated dependencies [544b42d]
- Updated dependencies [2787c1e]
- Updated dependencies [90957bd]
- Updated dependencies [1b4effa]
- Updated dependencies [6855121]
- Updated dependencies [d7ed271]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/config@0.1.0
  - @stackra/platform@0.1.0
  - @stackra/consent@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
