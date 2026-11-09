---
"@stackra/contracts": minor
---

Two new ports, `IdempotencyRetentionSource` (how long an Idempotency-Key is kept) and `VersionSupportSource` (how many
months an API version stays supported), so an operator's settings can set both without `@stackra/actions` or
`@stackra/versioning` depending on `@stackra/settings`.
