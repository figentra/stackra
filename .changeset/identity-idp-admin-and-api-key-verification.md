---
"@stackra/identity": minor
---

Add the `IdpAdmin` port (users, machine users, ending sessions, the OAuth device flow, login policy) with
`ZitadelIdpAdminDriver`, configured by `IdpAdminConfig` (the managed or own ZITADEL URL and the
`IDENTITY_IDP_ADMIN_TOKEN` secret), and `MemoryIdpAdminDriver` (STA-834). Add API-key verification by hash: the
`ApiKeyStore` port, `hashApiKey`, `ApiKeyVerifierService` and `MemoryApiKeyStoreDriver` (STA-835, ADR 0410).
