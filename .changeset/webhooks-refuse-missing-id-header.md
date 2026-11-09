---
"@stackra/webhooks": patch
---

`WebhookReceiver` refuses an event with `WebhookEventIdMissingError` when its signature `idHeader` is missing or empty and no complete `eventId` parts stand in for it, or when its Integration names neither. Such an event used to be keyed by `""`, so the inbox kept only the first one.
