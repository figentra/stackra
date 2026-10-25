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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                           |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/licensing`; workspace imports: `@stackra/contracts`, `@stackra/errors`, `@stackra/transport` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | the licence key is supplied by the caller and is never stored or logged                                                                                                        |
| Security                              | PASS   | verification is offline with Web Crypto; the key goes in a request body, never a URL                                                                                           |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                   |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                         |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                        |

- Boundaries: imports `@stackra/contracts`, `@stackra/errors`, `@stackra/transport` only; no app, service or
  `encore.dev`; no Keygen SDK, no crypto dependency.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; `<name>.<kind>.ts`; one declaration per file; snake_case refusal reasons.
- Secrets: none held; the licence key is never logged or put in a refusal.

## Deploy modes

| Mode       | Behaviour                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                                                                      |
| On-prem    | identical: the same build, no SaaS-only code path                                                                                     |
| Air-gapped | identical: verification is offline; `checkLicenceKey` is the only network call, opt-in, through a `Transport` the consumer configures |

## Correctness properties

- **P-001**: `package.json` `exports` lists only `.`, and `stackra.config.ts` calls `definePackage({})` — Validates: FR-001
- **P-002**: `.` exports `verifyLicenceFile`, `licenceStanding`, `checkLicenceKey`, `LicenceStanding`, `LicenceFileInvalidError`, `LicenceCheckUnavailableError` and the types `Licence`, `LicenceFileOptions`, `LicenceKeyCheck` and `LicenceKeyCheckOptions` — Validates: FR-002
- **P-003**: `verifyLicenceFile` checks an Ed25519 signature over `license/<enc>` and decrypts with AES-256-GCM under the SHA-256 of the key through Web Crypto, with no `node:crypto` import — Validates: FR-003
- **P-004**: `licenceStanding` returns a standing for an expired licence instead of throwing, and no function calls out unless `checkLicenceKey` is called — Validates: FR-004
