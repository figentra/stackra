---
"@stackra/integrations": minor
"@stackra/webhooks": minor
---

`webhooks.eventId` can name several parts, `{ parts: [{ path }, { header }] }`, joined with `:` into one inbox id, for a provider whose events carry no unique id of their own (an order id plus its state plus the delivery timestamp). The receiver refuses an event whose named part is missing with `WebhookEventIdMissingError` instead of keying it by an empty id, which would have deduplicated every such event as one; this applies to the single `{ path }` form too.
