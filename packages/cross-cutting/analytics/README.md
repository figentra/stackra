# @stackra/analytics

Product analytics delivery for Stackra surfaces (ADR 0298): an event leaves the device only once the visitor has
granted its consent category. Events fired before the decision wait in a bounded, ordered queue that is sent in order on
acceptance and discarded unsent on refusal. Global Privacy Control counts as a refusal.

**Tier:** `tier:lib` (`packages/cross-cutting/analytics`). Entries `.`, `./contracts`, `./react` and `./testing`.
Depends on `@stackra/config`, `@stackra/consent`, `@stackra/container`, `@stackra/contracts`, `@stackra/events`,
`@stackra/validation` and zod; React is an optional peer of `./react`. The event base, `AnalyticsEvent`, lives in
`@stackra/events`; this package delivers it.

## What is here

| Entry         | Symbol                  | Use                                                                                  |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `.`           | `AnalyticsConfig`       | the configuration (key `analytics`): driver, gating category, queue bound, deny list |
| `.`           | `AnalyticsConfig$`      | the shipped schema a member's generated override extends                             |
| `.`           | `AnalyticsOptions`      | the configuration's shape                                                            |
| `.`           | `AnalyticsClient`       | the service that delivers: `track(event)`, `state`                                   |
| `.`           | `AnalyticsState`        | `opted_in`, `opted_out`, `pending`                                                   |
| `.`           | `NoneAnalyticsDriver`   | the default driver: sends nothing                                                    |
| `./contracts` | `AnalyticsDriver`       | the port a driver implements (`send(deliveries)`), with the `AnalyticsDelivery` type |
| `./react`     | `useAnalytics`          | the client of the nearest container                                                  |
| `./testing`   | `fakeAnalytics`         | a real client over memory and its own consent ledger, recording every tracked event  |
| `./testing`   | `AnalyticsFake`         | the class `fakeAnalytics` returns: `events()`, `tracked`, `state`, `delivered()`     |
| `./testing`   | `MemoryAnalyticsDriver` | the `memory` driver: keeps what it is sent                                           |

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

## Not here yet

Vendor drivers (PostHog for web and native) come later, with their names in `AnalyticsDriverName` and their keys. The
capture switches (`autocapturePageviews`, `autocaptureClicks`, `webVitals`, `sessionReplay`, `cookieless`) and
`ingestOrigin` are read by those drivers only.
