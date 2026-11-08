---
"@stackra/integrations": minor
---

A managed client call can send a raw body with its own media type (`RequestOptions.body: { content, contentType }`,
a SOAP envelope) and read the answer as text (`text: true`); auth, retries, rate limits and the egress rule are
unchanged, and `fakeIntegrationApi` hands the raw body to the route as its text (STA-2617).
