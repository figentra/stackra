---
"@stackra/identity": minor
---

Add API-key last use (`ApiKeyRecord.lastUsedAt`, `ApiKeyStore.recordUse` with a no-op default, written by
`ApiKeyVerifierService` when older than the new `IdentityConfig.apiKeyLastUsedSeconds`), `IdpAdmin.listAuthMethods`
(enrolled methods as RFC 8176 `amr` codes, on the ZITADEL and memory drivers) for the security page's MFA enrolment
list, and the `AutomationPrincipals` port with `MemoryAutomationPrincipalsDriver` so an automation runs as its own
principal (ADR 0153 decision 2). STA-1264.
