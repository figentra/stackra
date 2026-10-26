---
"@stackra/integrations": minor
"@stackra/identity": minor
---

Add verification to the `ProviderResolver` capabilities (ADR 0376 decision 1 Note, STA-1282): `candidates` takes
`pin` to keep one mode only, `VerificationUse` (`platform` or `tenant`) on `VerificationRequest`, the
`VerificationCandidate` type and `VerificationService#verifyThrough`, which runs a platform check only through
platform Connections and a tenant check through the tenant's own Connection first. `VerificationResult` gains `mode`.
