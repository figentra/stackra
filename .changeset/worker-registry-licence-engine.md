---
"@figentra/worker-registry": minor
---

The registry's own licence engine (ADR 0453 decisions 13 and 14, stackra-183). Migration `0002_licences.sql` adds
licences, per-name grants, `stkl_` licence tokens (SHA-256 only), issuer tokens, Idempotency-Key receipts and
`name_rules`. The licence API `/-/stackra/v1/licences` (issue, renew, set grants, suspend, resume, revoke, add and
revoke a token) answers `RegistryLicence` of `@stackra/licensing/contracts`, needs an issuer token and an
Idempotency-Key, and caps live tokens at `REGISTRY_LICENCE_MAX_TOKENS`. `D1LicenceCheck` replaces the empty licence
check in `main.ts`. `@stackra-pro/ui` is an `internal` name (ADR 0461 decision 3): only an internal licence reads it,
and the catalogue does not list it.
