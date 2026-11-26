# Feature Specification: a durable consent proof store and a guardian sign-in verifier

**Feature Branch**: `figentra/sta-2818-consent-ledger`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the owner (change risk R3: a tenant-owned table, a migration, PII and signed tokens)

**Linear**: STA-2818

**Clarifications status**: complete

**Input**: `@stackra/consent` records consent proofs (terms accepted, a guardian consenting for a child) through the
`ConsentProofStore` port, but its only driver kept them in memory, so a restart lost the evidence a regulator may ask
for (GDPR Art. 7(1), PDPL). The `ConsentVerifier` port shipped only the fail-closed `none` driver, so a market that
requires a verified guardian consent could not record one at all. Batch 10 of the 26 Nov readiness backlog ("a durable
server-side consent ledger and a real consent verifier"); found again in the STA-316 threat model.

### Sources

- `packages/security/consent/src/core/drivers/memory-consent-proof-store.driver.ts`,
  `none-consent-verifier.driver.ts` (the only drivers before)
- `packages/security/consent/src/contracts/ports/consent-proof-store.port.ts`, `consent-verifier.port.ts`
- `packages/security/access-log` (the append-only, hash-chained, tenant-owned table pattern)
- `packages/security/tenancy` (`BelongsToTenant`, `TenantIsolationService`, the approval binding store's int test)
- ADR 0454 (decision 5, Consequences), ADR 0298 (decision 3), ADR 0212 (decision 3), ADR 0207 (decision 1), ADR 0239,
  ADR 0416
- The STA-316 threat model of `@stackra/consent` (branch `figentra/sta-316-threat-models`, not yet on main)

## Impact

- **Apps touched**: docs only (the ADR 0454 note of 2026-11-26)
- **Services touched**: none (a service binds the new drivers when it keeps consent evidence)
- **Packages touched**: consent (a model, its migration, a Postgres driver, a verifier driver, an attestation issuer,
  chain functions, an error, two config fields, a conformance suite, the manifest, README, AGENTS.md)
- **Public contract change**: new exports from `.` (`GuardianLoginConsentVerifierDriver`,
  `GuardianLoginAttestationIssuer`, `linkConsentProof`, `findConsentProofChainBreak`, `ConsentProofWriteFailedError`,
  types `ConsentProofLink`, `GuardianLoginAttestation`, `IssuedGuardianLoginAttestation`), from `./node`
  (`PostgresConsentProofStoreDriver`, `ConsentProofEntry`, `CONSENT_ENTITIES`) and from `./testing`
  (`describeConsentProofStoreConformance`); `ConsentConfig` gains `guardianLoginMaxAgeMinutes` (default 5) and
  `guardianLoginAttestationMinutes` (default 10); manifest drivers `ConsentProofStore.postgres` and
  `ConsentVerifier.guardian_login`, error `consent_proof_write_failed`, model `consent.consent_proof_entry`. No port
  changes; additive only.
- **Cross-service events**: none
- **Tenancy and data**: new tenant-owned table `consent.consent_proof_entries` (forced `tenant_id` policy, UPDATE
  revoked, a trigger refusing UPDATE for every role, unique `(tenant_id, subject, sequence)`), migration `0001`
- **Security and privacy**: proofs hold public ids, the document key and version, the text's hash, the answer, the
  instant, the channel and the verifier's reference (PII of the owning service); attestations are ES256 tokens signed by
  the consent `Signer`, never stored, carrying public ids, the document key, the sign-in time and method codes
- **Secrets**: none
- **ADR needed**: no new ADR; a note on ADR 0454 (decision 5 made durable, the verification follow-up done)
- **New dependencies**: workspace only (`@stackra/database`, `@stackra/model`, `@stackra/tenancy`, used by `./node`
  only)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/security/consent/README.md`, `packages/security/consent/AGENTS.md`, the ADR 0454 note,
  a changeset; the consent threat model on the STA-316 branch once it lands (two rows move from "None" to the new
  controls)
- **Lane**: full
- **Change risk**: R3 (a tenant-owned table and its migration, PII, signed tokens)

## Acceptance criteria

- **AC-001**: THE Postgres `ConsentProofStore` driver SHALL keep each proof as a row of `consent.consent_proof_entries`
  in the running call's tenant, and SHALL hand back the proofs exactly as appended (no field added or dropped).
- **AC-002**: THE table SHALL be append-only: UPDATE revoked from the service's role and refused by a trigger for every
  role, including the owner.
- **AC-003**: WHILE a session runs in one tenant, THE store SHALL never read another tenant's proofs, and a row written
  for another tenant SHALL fail the policy; an append in no tenant SHALL fail closed.
- **AC-004**: THE store SHALL chain each subject's proofs (`sequence`, `previous_hash`, `hash`), and
  `findConsentProofChainBreak` SHALL name the first link that was edited, removed, reordered or belongs to another
  subject.
- **AC-005**: WHEN two answers for one subject are appended at once, THE store SHALL leave one linear chain (the loser
  retries after the new head in a fresh savepoint) and SHALL refuse with `consent_proof_write_failed` after five lost
  races; any other failure propagates.
- **AC-006**: THE store SHALL append in a savepoint of the caller's transaction, so a proof commits or rolls back with
  the answer's own work.
- **AC-007**: WHEN a guardian has signed in within `guardianLoginMaxAgeMinutes`, THE issuer SHALL sign an attestation
  bound to the guardian (the caller), the person and the document, valid for `guardianLoginAttestationMinutes`; IF the
  call has no assurance, no `auth_time`, or a stale or future sign-in THEN it SHALL refuse with `consent_not_verified`.
- **AC-008**: THE `guardian_login` verifier SHALL pass only a well-formed attestation signed by a trusted key, for the
  request's guardian, person and document, issued no later than the clock skew and not expired, and SHALL answer its id
  as the reference; it SHALL answer not verified, without throwing, for any other method or token (a consent snapshot
  included).
- **AC-009**: WHEN the verifier passes, `ConsentProofService.answerFor` SHALL record `guardian_login` and the
  attestation id on the proof; WHEN it does not, nothing SHALL be written.

## Status history

- 2026-11-26 → Clarified (the issue's "Done when"; the item of readiness batch 10)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch)
