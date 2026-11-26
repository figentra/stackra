# Implementation Plan: a durable consent proof store and a guardian sign-in verifier

**Spec**: `.agents/specs/sta-2818-consent-durable-proofs/spec.md` · **Linear**: STA-2818 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2818-consent-durable-proofs/spec.md`

## Summary

`@stackra/consent/node` gains the Postgres `ConsentProofStore`: a tenant-owned, append-only table with one hash chain
per subject, appended in a savepoint of the caller's transaction. The package gains its first real `ConsentVerifier`,
`guardian_login`: a server-signed attestation of the guardian's fresh sign-in, issued from the call's verified
assurance and checked for key, signature, binding and lifetime. Both are additive; the defaults (`memory`, `none`) stay.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/security/consent`
- **Testing**: vitest unit tests in `src/**/__tests__/`; one `.int` test on a Testcontainers Postgres
- **Storage**: new table `consent.consent_proof_entries` (Postgres)
- **Runtime target**: a service that keeps consent evidence (node); the verifier and issuer are isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | database, model and tenancy are imported by `./node` only; none imports consent |
| Secrets (ADR 0009)                    | PASS   | none; signing stays with the `Signer` port                                      |
| Security                              | PASS   | fail-closed verifier; tokens bound and short-lived; no UPDATE on evidence       |
| HTTP and events                       | N/A    | no route, header or event                                                       |
| Tenancy                               | PASS   | forced `tenant_id` policy; isolation int test as a NOBYPASSRLS role             |
| Delegation                            | PASS   | Claude only                                                                     |
| Not built yet (ADR 0011)              | N/A    | none                                                                            |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                           |
| Versions and catalogs                 | PASS   | workspace deps; a minor changeset                                               |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                               |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS.md, ADR 0454 note                                                |

## Deploy modes

| Mode       | Behaviour                                                                        |
| ---------- | -------------------------------------------------------------------------------- |
| SaaS       | a service binds `postgres` for `ConsentProofStore`, runs migration 0001          |
| On-prem    | same, against its own Postgres                                                   |
| Air-gapped | same; the verifier needs only the consent signer's public keys, no outbound call |

## Correctness properties

- **P-001**: a proof read back equals the proof appended, key for key — Validates: AC-001
- **P-002**: an UPDATE fails for the service role (permission) and for the owner (trigger) — Validates: AC-002
- **P-003**: tenant B counts zero of tenant A's rows, by the store and by SQL — Validates: AC-003
- **P-004**: every stored run verifies, and any single edit, gap, reorder or foreign link breaks it — Validates: AC-004
- **P-005**: four concurrent appends for one subject store sequences 1 to 4 that verify — Validates: AC-005
- **P-006**: each attempt runs in `database.transaction` (a savepoint), never `requiresNew` — Validates: AC-006
- **P-007**: only a fresh sign-in is attested, and only for someone else — Validates: AC-007
- **P-008**: the verifier answers `{ verified: false }` for each listed failure and never throws — Validates: AC-008
- **P-009**: a failed verification leaves the store empty — Validates: AC-009

## Architecture overview

`ConsentProofService` (unchanged) calls `ConsentProofStore.append`. The Postgres driver opens
`database.transaction(work)` per attempt (a savepoint inside the caller's transaction), reads the subject's head
(`orderBy sequence desc`, under the tenant policy), links the proof with `linkConsentProof` and inserts it. A unique
violation on `(tenant_id, subject, sequence)` rolls back that savepoint and retries, five times at most.

For `guardian_login`, the host's action (run by the guardian) calls `GuardianLoginAttestationIssuer.issue(ctx.actor.id,
child, document, ctx.assurance)`, then `answerFor(..., { method: guardian_login, evidence: token })`.
`GuardianLoginConsentVerifierDriver` decodes the token, checks the key in `ConsentSnapshotKeys`, the signature, the
binding and the lifetime, and answers the attestation id.

## Components and responsibilities

- `ConsentProofEntry` (model) and `CreateConsentProofEntriesMigration`: the table, its policy, indexes, revoke and
  trigger.
- `PostgresConsentProofStoreDriver`: append with retry, `latest`, `list`, the row-to-proof mapping.
- `linkConsentProof`, `hashConsentProofLink` (internal), `findConsentProofChainBreak`: the chain.
- `ConsentProofWriteFailedError`: `unavailable`, retryable.
- `GuardianLoginAttestationIssuer`, `GuardianLoginConsentVerifierDriver`, the attestation codec and schema (internal).
- `ConsentConfig`: `guardianLoginMaxAgeMinutes`, `guardianLoginAttestationMinutes`.
- `describeConsentProofStoreConformance` (`./testing`): run by the memory driver (unit) and the Postgres driver (int).

## Files and folders

```text
packages/security/consent/
  AGENTS.md
  README.md
  package.json
  stackra.manifest.json
  vitest.int.config.ts
  src/core/constants/consent-config-schema.constant.ts
  src/core/constants/guardian-login-attestation-schema.constant.ts
  src/core/schemas/consent-options.schema.ts
  src/core/drivers/guardian-login-consent-verifier.driver.ts
  src/core/errors/consent-proof-write-failed.error.ts
  src/core/functions/{link-consent-proof,hash-consent-proof-link,find-consent-proof-chain-break}.function.ts
  src/core/functions/{encode,decode}-guardian-login-attestation.function.ts
  src/core/functions/split-signed-token.function.ts (shared by both token decoders)
  src/core/functions/decode-consent-snapshot.function.ts (now reads through split-signed-token)
  src/core/services/guardian-login-attestation-issuer.service.ts
  src/core/types/{consent-proof-link,guardian-login-attestation,issued-guardian-login-attestation,decoded-guardian-login-attestation,split-signed-token}.type.ts
  src/node/models/consent-proof-entry.model.ts
  src/node/database/migrations/0001-create-consent-proof-entries.migration.ts
  src/node/drivers/postgres-consent-proof-store.driver.ts
  src/node/entities.gen.ts
  src/testing/functions/describe-consent-proof-store-conformance.function.ts
  (each with its test in __tests__/; the int test beside the Postgres driver)
apps/docs/src/docs/adr/0454-loyalty-programme-as-scoped-settings-a-tier-policy-port-public-balance-events-and-consent-evidence.mdx
.changeset/consent-durable-proof-store-guardian-login.md
```

## Data models and migrations

Migration `0001-create-consent-proof-entries` creates `consent.consent_proof_entries`: `id` (`cpf_…`), `tenant_id`
(forced equality policy `pol_consent_proof_entries_tenant_id`), `subject`, `given_by`, `relationship` (null),
`document`, `version`, `content_hash` (null), `granted`, `at`, `channel` (null), `verification_method` (null),
`verification_reference` (null), `sequence`, `previous_hash`, `hash`; unique `(tenant_id, subject, sequence)`, index
`(tenant_id, subject, document)`; `revoke update … from public, current_user`; function `consent.refuse_update()` and
trigger `trg_consent_proof_entries_refuse_update`. Forward only; gen's migrations int test applies, reverts and
re-applies it.

## Contracts

All additive (see the spec's Impact). `ConsentProofStore` and `ConsentVerifier` are unchanged. The attestation token
form is the consent snapshot's (`<payload>.<key id>.<signature>`), with `kind: "consent_guardian_login"` so neither
token reads as the other.

## Error handling

- Five lost races: `ConsentProofWriteFailedError` (retryable, no details). Any other database error propagates.
- An attestation that fails any check: `{ verified: false }`; `answerFor` then throws `ConsentNotVerifiedError` and
  writes nothing. A failure to read the trusted keys throws (the port's contract), and nothing is written.
- The issuer refuses a missing, stale or future sign-in with `ConsentNotVerifiedError`, and a self-attestation with a
  `RangeError`.

## Security and tenancy

The evidence can no longer be edited in place (revoke plus trigger), and an edit or deletion inside a subject's trail
is detectable by the chain. Tenant isolation rests on the forced policy, proven in the int test as a NOBYPASSRLS role
without UPDATE. The attestation is bound to the caller's own principal id and the call's verified `auth_time`, never
input, lives ten minutes by default, and is signed with the existing consent key; a replay inside its lifetime can only
record the same guardian's answer for the same person and document again.

## Testing strategy

- AC-001, AC-003, AC-005, AC-002: `postgres-consent-proof-store.driver.int.test.ts` (conformance suite, isolation, no
  tenant, update refused, concurrency, chain from stored rows) and the unit driver test (exact read back, nulls).
- AC-004: `find-consent-proof-chain-break.function.test.ts`, `link-consent-proof.function.test.ts`.
- AC-006: the unit driver test (a savepoint per attempt, never `requiresNew`; retry; refusal after five; other errors).
- AC-002 (compiled SQL): `0001-create-consent-proof-entries.migration.test.ts`.
- AC-007: `guardian-login-attestation-issuer.service.test.ts`.
- AC-008, AC-009: `guardian-login-consent-verifier.driver.test.ts` (with `ConsentProofService`).
- Each behaviour test was shown to fail with its line reverted (the PR lists the mutations).

## Rollout

- A minor changeset for `@stackra/consent`. Nothing changes for a service until it binds `postgres` or
  `guardian_login` and runs the migration.
- Rolling back: unbind the drivers; the table stays (forward-only migrations).

## Known risks

- The threat model of `@stackra/consent` lives on the unmerged STA-316 branch; its two "None" rows are updated there
  or in a follow-up once it lands.
- The attestation is signed with the consent snapshot key; a host that rotates that key lists both keys in the
  `static` keys driver, as for snapshots.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R3: waits for the owner's approval before it merges.

## ADRs

ADR 0454 note of 2026-11-26 (this branch). Implements ADR 0454 decision 5 durably and its verification follow-up;
keeps ADR 0298 decision 3 and ADR 0212 decision 3's pattern.

## Docs

`packages/security/consent/README.md`, `packages/security/consent/AGENTS.md`, the ADR 0454 note, the changeset.

## Complexity tracking

none
