---
"@stackra/gen": minor
"@stackra/events": minor
"@stackra/outbox": minor
---

A service's generated `#stackra/boot` now connects `EventBus` (when the service runs `@stackra/events` or
`@stackra/outbox`) and `InboxService` (with `@stackra/outbox`) after the container is ready, and disconnects both
when the shutdown signal aborts, so registered listeners, consumed-event subscribers and relays receive events. Add
`EventBus#disconnect` (removes only the subscriptions `connect` made) and `InboxService#disconnect` (drops the relays).
