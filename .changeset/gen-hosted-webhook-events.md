---
"@stackra/gen": minor
---

A connector package's manifest lists its `WebhookEvent` classes in `webhookEvents` (class, entry, Integration and
Connection), and a hosting service registers them from it, so the service names no provider. Gen refuses a hosted
event that is half paired (`webhook_event_unpaired`) or routed twice (`webhook_route_duplicate`), and an own event
typed against a hosted Integration now carries that Integration's Connection, so its connection URL routes.
