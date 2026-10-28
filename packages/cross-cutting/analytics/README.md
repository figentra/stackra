# @stackra/analytics

Product analytics delivery for Stackra surfaces (ADR 0298): an event leaves the device only once the visitor has
granted its consent category. Events fired before the decision wait in a bounded, ordered queue that is sent in order on
acceptance and discarded unsent on refusal. Global Privacy Control counts as a refusal.

**Tier:** `tier:lib` (`packages/cross-cutting/analytics`). Entries `.`, `./contracts`, `./react`, `./native` and
`./testing`. Depends on `@stackra/config`, `@stackra/consent`, `@stackra/container`, `@stackra/contracts`,
`@stackra/events`, `@stackra/storage`, `@stackra/validation` and zod; React is an optional peer of `./react`, React Native of `./native`. The event base, `AnalyticsEvent`, lives in
`@stackra/events`; this package delivers it.

## What is here

| Entry         | Symbol                                                                                             | Use                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.`           | `AnalyticsConfig`                                                                                  | the configuration (key `analytics`): driver, gating category, queue bound, deny list   |
| `.`           | `AnalyticsConfig$`                                                                                 | the shipped schema a member's generated override extends                               |
| `.`           | `AnalyticsOptions`                                                                                 | the configuration's shape                                                              |
| `.`           | `AnalyticsClient`                                                                                  | the service that delivers: `track(event)`, `identify`, `group`, `reset`, `state`       |
| `.`           | `AnalyticsState`                                                                                   | `opted_in`, `opted_out`, `pending`                                                     |
| `.`           | `NoneAnalyticsDriver`                                                                              | the default driver: sends nothing                                                      |
| `.`           | `MemoryAnalyticsDriver`                                                                            | the `memory` driver: keeps what it is sent                                             |
| `.`           | `PosthogAnalyticsDriver`                                                                           | the `posthog` driver: one batch capture request per send, plain `fetch`                |
| `./contracts` | `AnalyticsDriver`                                                                                  | the port a driver implements (`send(deliveries)`), with the `AnalyticsDelivery` type   |
| `./contracts` | `AnalyticsDriverLookup`                                                                            | the port that finds a named driver instance a destination sends to                     |
| `.`           | `AnalyticsDestination`, `NoneAnalyticsDriverLookupDriver`                                          | one entry of `destinations`; the default lookup, which knows no named instance         |
| `./contracts` | `AnalyticsContext`                                                                                 | where a delivery was captured: library, page path or screen, locale, version, region   |
| `./contracts` | `AnalyticsDeliveryKind`                                                                            | `track`, `identify`, `group`: what a delivery asks the destination to do               |
| `./contracts` | `AnalyticsIdentity`                                                                                | the port that keeps the visitor's identity after consent (`AnalyticsIdentityRecord`)   |
| `.`           | `MemoryAnalyticsIdentityDriver`, `CookieAnalyticsIdentityDriver`, `StorageAnalyticsIdentityDriver` | identity drivers `memory` (default, one launch), `cookie` (web), `storage` (device)    |
| `.`           | `PageViewed`, `ScreenViewed`, `ElementClicked`                                                     | the built-in auto-capture events `page.viewed`, `screen.viewed`, `element.clicked`     |
| `./react`     | `useAutocapture`                                                                                   | page views per path and `data-track` clicks, as the capture switches allow             |
| `./native`    | `useScreenViews`                                                                                   | screen views per focused route, while `autocapturePageviews` is on                     |
| `./react`     | `useAnalytics`                                                                                     | the client of the nearest container                                                    |
| `./native`    | `PosthogAnalyticsDriver`                                                                           | the `posthog` driver for React Native: batches of 20, flushed when the app backgrounds |
| `./testing`   | `fakeAnalytics`                                                                                    | a real client over memory and its own consent ledger, recording every tracked event    |
| `./testing`   | `AnalyticsFake`                                                                                    | the class `fakeAnalytics` returns: `events()`, `tracked`, `state`, `delivered()`       |

## The rules, in order

1. `track(event)` takes an instance of an `AnalyticsEvent({ name })` class; anything else is a `TypeError`.
2. Only the fields the event's schema declares leave the device, minus the names in `denyProperties`, inside the
   envelope below. No identity beyond the anonymous ids, the user's public id and the group ids is attached.
3. The category in `consentCategory` decides, through `ConsentLedger`: granted sends at once (after anything that
   waited), refused drops, undecided queues.
4. The queue holds at most `queueLimit` events. A full queue drops the newest, so the first view survives.
5. On acceptance the queue is sent in its order, each event with the time it was captured. On refusal it is discarded.
6. After consent, the delivery engine batches, retries and samples (below). A failed send never reaches the code that
   tracked.

## The delivery envelope (v2)

Every `AnalyticsDelivery` a driver receives carries:

| Field         | Holds                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `eventId`     | `evt_` and 26 time-ordered Crockford base32 characters; every destination dedups on it             |
| `name`        | the locked event name, such as `lead.submitted`                                                    |
| `properties`  | the schema-declared fields minus `denyProperties`                                                  |
| `occurredAt`  | the capture time, ISO 8601                                                                         |
| `anonymousId` | `anon_...`, made after consent; kept by the identity driver only while consent holds               |
| `kind`        | `track` (also when absent), `identify` or `group`                                                  |
| `userId`      | the signed-in user's public id once the host calls `identify`                                      |
| `groups`      | group type to id, once the host calls `group` (for example `scope` to the scope's public id)       |
| `sessionId`   | `ses_...`, made after consent, one per launch                                                      |
| `context`     | `AnalyticsContext`: `library`, and when known `page.path` (no query), `screen`, `locale`, `region` |

A driver sends these ids and never makes its own.

## Identity

`identify(userId)` after sign-in links the anonymous visitor to the user's public id (never an email or a phone):
an `identify` delivery tells the destinations, and every later event carries `userId`. `group(type, id)` puts the
visitor in a group, one per type. `reset()` on sign-out forgets the user and the groups and starts a new anonymous
visitor and session. Both calls are deliveries of their own kind, so they wait for consent and are dropped on refusal
like events.

The anonymous id survives a reload only through the identity driver (`identityDriver`): `memory` keeps nothing past
the launch (the default), `cookie` keeps one first-party cookie (`identityCookieName`, `identityExpiryDays`) and
`storage` the device's `prefs` area. The client writes it only while the category is granted and removes it as soon as
it is refused or on `reset`; the session id is never kept, and the user id and groups are not restored (call
`identify` and `group` again after sign-in). A destination that must not see the raw user id hashes it.

## The delivery engine

Once consent allows a send, each delivery goes into a buffer (at most `bufferLimit`) that is sent as one batch when it
holds `flushAt` deliveries (default 20) or `flushIntervalMs` after the first one waited (default 5 s; `0` sends at
once). `flush()` sends it now. A batch the driver rejects goes back to the front and is retried `retryAttempts` times
(default 3) after `backoffDelay` waits with equal jitter from `retryBaseMs` to `retryMaxMs`; new deliveries wait behind
it, so order holds. When the retries are spent the batch goes to the offline queue (`offlineDriver`: `none` drops it,
`storage` keeps up to `offlineLimit` on the device), and the next launch sends it first once consent is granted. When
the page hides (`pagehide`, or `visibilitychange` to hidden) the buffer leaves at once through the driver's `beacon`
(`navigator.sendBeacon`), or `send` with `keepalive` when the driver has none.

Sampling is per visitor: `sampleRate` (0 to 1) keeps the same share of anonymous ids for every event, so funnels stay
whole, and `sampleRates` gives one event its own rate (`{ "page.scrolled": 0.1 }`). `identify` and `group` are never
sampled. A refusal drops the buffer and the offline queue.

## Destinations

By default everything goes to one destination: the `driver` instance, gated by `consentCategory`. To send to several,
name the extra driver instances in `drivers` and list the destinations, each with its own consent category and, when
it should not take every event, an `include` or `exclude` list of event names:

```ts
export class AnalyticsConfig extends BaseAnalyticsConfig {
  override driver: DriverName<AnalyticsDriver> = "posthog";
  override drivers = { segment: "segment" };
  override destinations = [
    { driver: "default", category: ConsentCategory.Analytics },
    { driver: "segment", category: ConsentCategory.Marketing, include: ["order.placed"] },
  ];
}
```

Each destination is its own lane: its own pre-consent queue, buffer, retries and backoff, so a refused category or a
destination that is down never holds another. Every destination gets the same `eventId` and visitor ids, so they
dedup on the same key. `include` and `exclude` match whole event names and apply to tracked events only; `identify`
and `group` reach every granted destination. The visitor's identity is kept (cookie or storage) only while
`consentCategory` is granted; the in-memory ids go once no destination is granted. Only the `default` destination
uses the offline queue: a named destination drops a batch once its retries are spent. A destination naming an
instance the `AnalyticsDriverLookup` does not know fails at construction. The shipped lookup (`none`) knows none:
named instances need the host runtime's lookup over the container's named instances (not built yet).

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
origin) wins over it. The driver posts to `<origin>/batch/` with plain `fetch`, no SDK. It maps the envelope:
`userId` (once identified) or else `anonymousId` is the `distinct_id`, `sessionId` the `$session_id`, `eventId` the
`$insert_id`, `context.page.path` the `$pathname` and `groups` the `$groups`; an `identify` delivery is `$identify` with
`$anon_distinct_id` (PostHog merges the two) and a `group` delivery is `$groupidentify`. Only an identified visitor's
events carry `$process_person_profile: true`. On a phone, take the driver
from `@stackra/analytics/native`: it buffers and sends one batch at 20 events or when `AppState` goes to `background`.

## Auto-capture

With `autocapturePageviews` on, the app shell calls `useAutocapture(useLocation().pathname)` on the web, which tracks
`page.viewed` with the path (never the query or hash) once per path change, and `useScreenViews(routeName)` on a phone,
which tracks `screen.viewed` with the route name (never its params). With `autocaptureClicks` on, `useAutocapture` also
tracks `element.clicked` for a click inside an element marked `data-track="checkout.pay"`: only that name (letters,
digits, `.`, `_`, `-`) and the path leave, never the element's text or values. Taps are not auto-captured on native;
track them explicitly. Every auto-captured event goes through the client like any other, so consent, sampling and
destinations apply. Web vitals and session replay are not analytics: `TelemetryConfig` (@stackra/logger) owns them.

## Not here yet

Nothing sets `context.screen`, `appVersion` or `region` in the envelope yet. @stackra/navigation does not call the
auto-capture hooks yet: the app shell calls them. The container-backed `AnalyticsDriverLookup` that hands named
instances to the client is not built yet, so only the `default` destination sends in a host today. Hashing the user
id per destination belongs to the destination drivers (stackra-412).
