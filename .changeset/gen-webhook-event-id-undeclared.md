---
"@stackra/gen": minor
---

Gen refuses an Integration whose `webhooks` use a scheme other than Standard Webhooks (`hmac` or a regional gateway's)
and name neither `eventId` nor `signature.idHeader`, with `webhook_event_id_undeclared`. Such an Integration keyed every
inbound event by the id `""`, so the inbox kept only the first one. Name `eventId` (the payload `path` of the
provider's event id, or `parts` of paths and headers) or a signature `idHeader`, or use `SignatureScheme.StandardWebhooks`.
