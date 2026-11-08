---
"@stackra/integrations": minor
---

The managed client gains `api.send({ method, path, headers, body, idempotencyKey, signal })`, which answers
`{ status, headers, body }` as the provider sent it, at every status, for a caller that must read a refusal's body (a
fiscal authority's validation result). Auth, the egress rule (the path stays under the Integration's `baseUrl`), rate
limits and the transient retries are those of the typed calls; once retries are spent the last answer is returned, and
`ProviderUnavailableError` is thrown only when nothing came back. `fakeIntegrationApi` answers `send` from its routes
(STA-2607).
