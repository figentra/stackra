---
"@stackra/webhooks": minor
---

Add `@stackra/webhooks`: Standard Webhooks signing and verification with `SignatureScheme`, the `WebhookReceiver` that
verifies an inbound provider webhook against the secret its Integration names and routes it to its `WebhookEvent`
class through the outbox, outbound delivery of `webhook: true` integration events as a queue job with retries, a
delivery log, secret rotation and automatic disable, and the `deliverWebhook` test helper.
