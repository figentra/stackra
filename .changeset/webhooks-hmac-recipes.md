---
"@stackra/webhooks": minor
---

Verify provider webhook signatures from Integration data (STA-672, spec task T014). `SignatureScheme.Hmac` reads the
Integration's `webhooks.signature` recipe (header layout, HMAC hash, hex or Base64, the signed text, the tolerance) and
`verifyHmacWebhook` checks it in constant time; `WebhookReceiver` dispatches by scheme and keys an `hmac` event by its
id header or payload id. `registerWebhookEvents` refuses an `hmac` Integration without a recipe.
