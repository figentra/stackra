---
"@stackra/licensing": minor
---

Add `@stackra/licensing`, the Keygen licence verifier of ADR 0178: `verifyLicenceFile` checks a Keygen licence file
offline (Ed25519 signature over `license/<enc>`, AES-256-GCM decryption for encrypted files, Web Crypto only) and
returns the `Licence` with its limits, expiries and entitlement codes; `licenceStanding` gives the soft-enforcement
standing (`active`, `grace`, `read_only`) from the earlier of the licence and file expiry and a grace period, with
suspended and banned licences read-only at once; `checkLicenceKey` runs Keygen's `validate-key` through a `Transport`
for a connected install that opted in; `LicenceFileInvalidError` and `LicenceCheckUnavailableError` are its refusals.
