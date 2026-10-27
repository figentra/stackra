---
"@stackra/events": patch
"@stackra/contracts": patch
---

`newEventId` is `mintPublicId("evt")` (STA-1385): bus event ids now share the lowercase, time-ordered UUIDv7 form of
action and outbox ids. Older uppercase ids stay valid, since ids compare as strings. The `PublicId` docblock now names
`mintPublicId` as the one minter.
