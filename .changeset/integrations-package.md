---
"@stackra/integrations": minor
---

Add `@stackra/integrations`, provider integrations (ADR 0308): the `Integration({ provider, category, levels, auth,
... })` and `Connection<I>` kind bases, the managed client behind `api` with the six auth types, rate limits, retries and
typed refusals (`ProviderRefusedError`, `ProviderUnavailableError`, `ConnectionCheckFailedError`,
`InvalidSignatureError`), the `ConnectionStore` port with its `local` and `hosted` drivers, and `fakeIntegrationApi`,
`makeConnection`, `.withIntegrationApi` and `.withConnection` for tests.
