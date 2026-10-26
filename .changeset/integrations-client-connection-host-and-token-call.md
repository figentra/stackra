---
"@stackra/integrations": minor
---

Add `ClientConnectionHostDriver`, the `ConnectionHost` over the integrations service's generated client (the host passes
its refs as `ConnectionHostCalls`); export `requestToken` with its `TokenRequest` (the endpoint and client as data) for
a store host's code exchange and refresh; `ConnectionHost#store` takes an optional `credentialsExpireAt`, filled from
`ConnectInput.credentialsExpireAt` by the hosted store.
