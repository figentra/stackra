---
"@stackra/identity": minor
---

`ServiceApiKeyStoreDriver` (`./node`, driver `service`): the `ApiKeyStore` of a service that answers API-key calls. It
reads a key's record from the identity service by hash (`principals.api_key.verify@1`), caches a verified record for
the new `IdentityConfig.apiKeyCacheSeconds` (30 by default), never caches an unknown key, and forgets a principal's
records at once on `evictPrincipal` (a revoke). Worst case after a revoke whose event has not arrived: the cache window.
