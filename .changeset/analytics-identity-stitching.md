---
"@stackra/analytics": minor
---

Identity stitching: `AnalyticsClient.identify(userId)`, `group(type, id)` and `reset()`. Both calls are deliveries
of their own `AnalyticsDeliveryKind` (`identify`, `group`), gated and queued like events; later events carry `userId`
and `groups`. The new `AnalyticsIdentity` port keeps the anonymous id across launches only while consent holds, with
`memory` (default), `cookie` and `storage` drivers and the `identityDriver`, `identityCookieName` and
`identityExpiryDays` settings. The PostHog driver maps `identify` to `$identify` and `group` to `$groupidentify`, and
sends an identified visitor's events as the user with a person profile.
