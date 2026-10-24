# Plan: `@stackra/licensing`

**Spec**: `.agents/specs/sta-348-licensing/spec.md`

## Design

- `verifyLicenceFile` reads the armour between `-----BEGIN LICENSE FILE-----` markers, decodes the certificate
  `{ enc, sig, alg }`, refuses an unknown `alg`, verifies the Ed25519 `sig` over `license/<enc>` with the hex verify
  key, then decodes (`base64+ed25519`) or decrypts (`aes-256-gcm+ed25519`, internal `decryptLicence`) `enc` and maps
  the dataset with the internal `readLicence`.
- `licenceStanding` is pure: the earlier of `expiry` and `fileExpiry` ends `active`; `grace` runs for the given
  `Duration`; then `read_only`. `SUSPENDED` and `BANNED` are `read_only` at once.
- `checkLicenceKey` posts Keygen's `validate-key` action through a `Transport` (default `createTransport()`), JSON:API
  headers, key in the body; a non-200 or a body without `meta.valid` refuses with `LicenceCheckUnavailableError`.
- Two refusals: `LicenceFileInvalidError` (`FailedPrecondition`, detail `reason`) and `LicenceCheckUnavailableError`
  (`Unavailable`, detail `status`).

## Constitution check

- Boundaries: imports `@stackra/contracts`, `@stackra/errors`, `@stackra/transport` only; no app, service or
  `encore.dev`; no Keygen SDK, no crypto dependency.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; `<name>.<kind>.ts`; one declaration per file; snake_case refusal reasons.
- Secrets: none held; the licence key is never logged or put in a refusal.
