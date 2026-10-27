---
"@stackra/integrations": minor
---

`IntegrationWebhooks` takes an optional `recipe` (`WebhookSchemeRecipe`): the data of a webhook scheme that is not an
HMAC over the raw body (where the token, signature or JWT sits, the ordered signed fields and their decimals, the hash,
an encrypted body's IV and tag headers), read by the new `@stackra/webhooks` schemes of the regional gateways
(STA-1357). Type only; additive.
