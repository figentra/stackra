---
"@stackra/webhooks": patch
"@stackra/integrations": patch
---

`WebhookReceiver` parses a verified body by its recipe's `bodyFormat`: `json` (the default) as before, or `form`, an
`application/x-www-form-urlencoded` body read into percent-decoded string values, which route the event
(`eventType.path`), key it (`eventId.path`) and create it. A verified form-encoded delivery no longer throws a
`SyntaxError` before routing. `WebhookSchemeRecipe.bodyFormat` now documents that it governs both the verifier and the
receiver.
