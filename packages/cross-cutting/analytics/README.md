# @stackra/analytics

Product analytics delivery for Stackra surfaces (ADR 0298): an event leaves the device only once the visitor has
granted its consent category. Events fired before the decision wait in a bounded, ordered queue that is sent in order on
acceptance and discarded unsent on refusal. Global Privacy Control counts as a refusal.

**Tier:** `tier:lib` (`packages/cross-cutting/analytics`). Entries `.`, `./contracts`, `./react`, `./native` and
`./testing`. Depends on `@stackra/config`, `@stackra/consent`, `@stackra/container`, `@stackra/contracts`,
`@stackra/events`, `@stackra/validation` and zod; React is an optional peer of `./react`, React Native of `./native`. The event base, `AnalyticsEvent`, lives in
`@stackra/events`; this package delivers it.

## What is here

| Entry         | Symbol                   | Use                                                                                    |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `.`           | `AnalyticsConfig`        | the configuration (key `analytics`): driver, gating category, queue bound, deny list   |
| `.`           | `AnalyticsConfig$`       | the shipped schema a member's generated override extends                               |
| `.`           | `AnalyticsOptions`       | the configuration's shape                                                              |
| `.`           | `AnalyticsClient`        | the service that delivers: `track(event)`, `state`                                     |
| `.`           | `AnalyticsState`         | `opted_in`, `opted_out`, `pending`                                                     |
| `.`           | `NoneAnalyticsDriver`    | the default driver: sends nothing                                                      |
| `.`           | `MemoryAnalyticsDriver`  | the `memory` driver: keeps what it is sent                                             |
| `.`           | `PosthogAnalyticsDriver` | the `posthog` driver: one batch capture request per send, plain `fetch`                |
| `./contracts` | `AnalyticsDriver`        | the port a driver implements (`send(deliveries)`), with the `AnalyticsDelivery` type   |
| `./react`     | `useAnalytics`           | the client of the nearest container                                                    |
| `./native`    | `PosthogAnalyticsDriver` | the `posthog` driver for React Native: batches of 20, flushed when the app backgrounds |
| `./testing`   | `fakeAnalytics`          | a real client over memory and its own consent ledger, recording every tracked event    |
| `./testing`   | `AnalyticsFake`          | the class `fakeAnalytics` returns: `events()`, `tracked`, `state`, `delivered()`       |

## The rules, in order

1. `track(event)` takes an instance of an `AnalyticsEvent({ name })` class; anything else is a `TypeError`.
2. Only the fields the event's schema declares leave the device, minus the names in `denyProperties`. No identity is
   attached.
3. The category in `consentCategory` decides, through `ConsentLedger`: granted sends at once (after anything that
   waited), refused drops, undecided queues.
4. The queue holds at most `queueLimit` events. A full queue drops the newest, so the first view survives.
5. On acceptance the queue is sent in its order, each event with the time it was captured. On refusal it is discarded.
6. A driver owns its retries. A failed send never reaches the code that tracked.

## Use

```ts
import { AnalyticsConfig as BaseAnalyticsConfig } from "@stackra/analytics";
import type { AnalyticsDriver } from "@stackra/analytics/contracts";
import { ConsentCategory } from "@stackra/consent";
import type { DriverName } from "@stackra/container";

export class AnalyticsConfig extends BaseAnalyticsConfig {
  override driver: DriverName<AnalyticsDriver> = "none";
  override consentCategory: ConsentCategory = ConsentCategory.Analytics;
  override denyProperties = ["email", "phone"];
}
```

```tsx
const analytics = useAnalytics();
useEffect(() => {
  if (sent) analytics.track(LeadSubmitted.create({ plan }));
}, [sent, plan, analytics]);
```

```ts
const analytics = fakeAnalytics();
analytics.track(LeadSubmitted.create({ plan: "pro" }));
expect(analytics.events()).toEqual([LeadSubmitted.create({ plan: "pro" })]);
expect(analytics.delivered()).toEqual([]); // nobody accepted yet
```

## PostHog

Set `driver: "posthog"` and feed `posthogKey` (the public `phc_...` project key) from the host's env configuration;
`posthogHost` defaults to `https://eu.i.posthog.com`, and a non-empty `ingestOrigin` (a reverse proxy on the site's own
origin) wins over it. The driver posts to `<origin>/batch/` with plain `fetch`, no SDK. It is called only after
consent, so its anonymous `distinct_id` (random, created on the first send, held in memory, never stored) never leaves
before the visitor accepts, and every event carries `$process_person_profile: false`. On a phone, take the driver
from `@stackra/analytics/native`: it buffers and sends one batch at 20 events or when `AppState` goes to `background`.

## Not here yet

The capture switches (`autocapturePageviews`, `autocaptureClicks`, `webVitals`, `sessionReplay`) are not read by the
PostHog driver yet: it sends only the events tracked through `AnalyticsClient`.
