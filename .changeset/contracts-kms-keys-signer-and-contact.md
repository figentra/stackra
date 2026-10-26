---
"@stackra/contracts": minor
---

Add per-tenant and per-subject keys, signing and a principal's contact facts (ADR 0414, 0415, 0416):
`AwsKmsKeyProviderDriver` serves a tenant's data keys unwrapped through AWS KMS with the tenant and key id as the
encryption context, `wrapTenantKey` makes a new wrapped key, and `SubjectKeyProviderDriver` derives a key per data
subject (HKDF over the subject's salt) so erasing one person crypto-shreds only them. The new `Signer` port signs with
ES256 through `MemorySignerDriver` or `AwsKmsSignerDriver` (the private key stays in KMS), and `verifySignature`
checks a signature offline. `IdentityResolver.principalOf` returns the whole `VerifiedPrincipal`, which now carries the
verified `phone` and the `timeZone` beside `locale`; implementations must add the method. No SDK dependency: the host
passes its KMS client (`AwsKmsApi`).
