# Feature Specification: `@stackra/licensing`, the Keygen licence verifier

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (registry v3.1 row: entry `.` only, no template imports, depends on transport;
ADR 0178 decisions 1 to 6)

**Input**: Build `@stackra/licensing` (security) for real: verify a Keygen signed licence file offline, derive the
soft-enforcement standing, and offer the opt-in online key check.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template imports nothing from this package)
- **Packages touched**: `packages/security/licensing` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables; no tenant word in the package
- **Secrets**: none held. The verify key is public; the licence key is the customer's and is never stored, logged or put
  in a refusal. The signing key stays in Keygen and Infisical KMS (ADR 0178 decision 2)
- **ADR needed**: no (ADR 0178, 0076 decision 3 as amended)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/errors`, `@stackra/transport` through `workspace:*`
- **Deploy modes**: offline verification works air-gapped; the online check is opt-in (ADR 0178 decision 5)
- **Lane**: full (a new package)
- **Change risk**: R3 (the signature check is what an on-prem install trusts)

## User Scenarios & Testing

### User Story 1 - Verify an on-prem licence without a network (Priority: P1)

An on-prem install reads its licence file and calls `verifyLicenceFile(file, { publicKey, licenceKey? })`.

**Independent Test**: `src/core/functions/__tests__/verify-licence-file.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a Keygen `base64+ed25519` file signed by the account key, **Then** it returns the `Licence` with its
   limits, expiries and entitlement codes.
2. **Given** an `aes-256-gcm+ed25519` file and its licence key, **Then** it decrypts and returns the `Licence`.
3. **Given** a file changed after signing, or signed by another key, **Then** it refuses with `LicenceFileInvalidError`
   (`bad_signature`).
4. **Given** an encrypted file without or with the wrong key, **Then** it refuses (`licence_key_required`,
   `decryption_failed`), and the key is not in the refusal.

### User Story 2 - Soft enforcement (Priority: P1)

`licenceStanding(licence, grace, now)` says `active`, `grace` or `read_only`.

**Independent Test**: `src/core/functions/__tests__/licence-standing.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a time before the earlier of licence and file expiry, **Then** `active`.
2. **Given** a time within `grace` after it, **Then** `grace`; after that, `read_only`.
3. **Given** a perpetual licence, **Then** `active`; **given** `SUSPENDED` or `BANNED`, **then** `read_only` at once.

### User Story 3 - Opt-in online check (Priority: P2)

A connected install that opted in calls `checkLicenceKey({ account, licenceKey, fingerprint?, transport? })`.

**Independent Test**: `src/core/functions/__tests__/check-licence-key.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** Keygen answers 200 with `meta.valid`, **Then** it returns `{ valid, code, detail }`; the key is in the body,
   never the URL.
2. **Given** a non-200 status or no `meta.valid`, **Then** it refuses with `LicenceCheckUnavailableError`.

## Requirements

- **FR-001**: The member has the v3.1 shape: `package.json` with `.` only, `tsconfig.json` on one preset,
  `turbo.jsonc` with `tier:lib`, `stackra.config.ts` with `definePackage({})`, README, AGENTS.
- **FR-002**: `.` exports `verifyLicenceFile`, `licenceStanding`, `checkLicenceKey`, `LicenceStanding`,
  `LicenceFileInvalidError`, `LicenceCheckUnavailableError` and the types `Licence`, `LicenceFileOptions`,
  `LicenceKeyCheck`, `LicenceKeyCheckOptions`.
- **FR-003**: Verification uses Web Crypto only (Ed25519 over `license/<enc>`, AES-256-GCM under SHA-256 of the key).
- **FR-004**: No call home unless `checkLicenceKey` is called; expiry never throws.

## Success Criteria

- **SC-001**: Every symbol of FR-002 exists; the registry row (entry `.`, depends on transport) holds. The template
  imports nothing from this package, so there is no template symbol to meet.
- **SC-002**: Every public symbol has a test beside it; tests pass in the testing workflow.
- **SC-003**: Typecheck, lint and build are green in the testing workflow.
