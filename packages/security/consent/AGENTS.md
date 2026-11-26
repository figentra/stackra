<!--
Stackra file contract:
Purpose: the agent rules of @stackra/consent: where code goes, entries, the consent and proof invariants, PII.
Boundary: documentation only; the user-facing guide is README.md.
Runtime: none (Markdown)
Governing contract: ADR 0298; ADR 0454; ADR 0472; OS-284; STA-1323; STA-2818.
-->

# AGENTS — @stackra/consent

Visitor consent: decline by default, Global Privacy Control refuses, the decision stored with its policy version
(ADR 0298). Member at `packages/security/consent` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entries `.`, `./contracts`, `./node`, `./react`, `./testing`, `./ui`.

## Where code goes

| You are writing…                     | It goes in…                                               |
| ------------------------------------ | --------------------------------------------------------- |
| The configuration (`ConsentConfig`)  | `src/config/consent.config.ts`                            |
| Its schema and shipped `X$`          | `src/core/schemas/`, `src/core/constants/`                |
| A port, its enum and the record type | `src/contracts/{ports,enums,types}/`                      |
| A store driver                       | `src/core/drivers/<name>-consent-store.driver.ts`         |
| A region source driver               | `src/core/drivers/<name>-region-source.driver.ts`         |
| A snapshot keys driver               | `src/core/drivers/<name>-consent-snapshot-keys.driver.ts` |
| A service (ledger, proofs, snapshot) | `src/core/services/`                                      |
| A verifier driver                    | `src/core/drivers/<method>-consent-verifier.driver.ts`    |
| A model, its migration, a DB driver  | `src/node/{models,database/migrations,drivers}/`          |
| The consent endpoint, its permission | `src/node/{actions,schemas,access}/`                      |
| A pure read of the ledger            | `src/core/functions/`                                     |
| React code                           | `src/react/consent/`                                      |
| A test helper                        | `src/testing/functions/`                                  |
| A category or regime label           | `assets/lang/<locale>/consent.json` (all 7 locales)       |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it            |

## Entries and barrels

- `src/{core,contracts,node,react,testing,ui}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- The record and snapshot schemas, `parseConsentRecord`, the snapshot codec, `hasGlobalPrivacyControl` and the
  storage key stay internal.
- `./ui` renders `@stackra/ui` web components; `./react` stays hooks only. Reject all has the same weight as accept
  all. Legal texts render as plain paragraphs, never as HTML.
- Proofs are append-only and hold ids, never the text; a relationship comes from `ConsentAuthority`, never input.
- A verification method (card check, signed form, guardian login) is named by the market pack, read by the caller, and
  checked by `ConsentVerifier` before anything is written; the stored method and reference are the verifier's answer.
  The default verifier is `none` and fails closed; never ship one that passes by default, and never record a consent
  whose verification failed. `guardian_login` (STA-2818) passes only a server-signed attestation of a fresh sign-in,
  bound to the guardian, the person and the document and still in date; the issuer reads the call's verified
  assurance only, never input.
- A proof is the consent evidence record (ADR 0454): `evidence` returns the rows as written; never summarise or merge
  them.
- The Postgres proof store (`./node`) is tenant-owned and append-only: no UPDATE (revoked and refused by a trigger),
  each subject's proofs one hash chain (`linkConsentProof`, checked by `findConsentProofChainBreak`), appended in a
  savepoint of the caller's transaction. A migration is a frozen snapshot: change the table with a new migration.

## This package

- The rules live in `ConsentLedger` only; a driver stores and never decides.
- Never grant anything optional before a decision unless the region's regime is opt-out and the category says
  `defaultGranted`. Global Privacy Control always refuses, and an App Tracking Transparency refusal always refuses `marketing`. Loosening either is a privacy change and needs review.
- A stored value is untrusted: read it through `parseConsentRecord`, which never throws.
- Consent state is decided on the client: `useConsent` shows no decision state in a server render; nothing here sets a
  cookie on the server. The server sees it only as a signed snapshot (ADR 0472): `ConsentSnapshotIssuer` re-applies
  the ledger's rules to the client's record and never trusts a client grant; `ConsentSnapshotVerifier` reads anything
  it cannot verify as refused and never throws. A snapshot is never stored as evidence.
- Outside `./node`, only `./contracts` of `@stackra/actions` is imported (the `ConsentCheck` port, `CALL_HEADERS` and
  `CallAssurance`); actions never imports consent. `./node` alone imports `@stackra/iam` (the endpoint's
  `Permissions`), `@stackra/database`, `@stackra/model` and `@stackra/tenancy` (the proof table), so browser entries
  never pull them in (ADR 0462).
- The endpoint's path is a literal in the action (gen reads it from source) and `CONSENT_SNAPSHOT_PATH` for the client;
  a test keeps them equal. `consentSnapshotHeaders` never throws and never sends a token issued for another decision.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

The record holds category choices, a policy version and a timestamp; no identifier of the visitor. A snapshot adds
only its subject id (an anonymous id, a public user id or a random id). Signing keys stay with the `Signer` driver;
never log a token. A stored proof (`consent.consent_proof_entries`) holds public ids, the document key and version, the
text's hash, the answer, the instant, the channel and the verifier's reference: personal data of the owning service, in
its PII table, erased by its retention rules (a DELETE). A guardian sign-in attestation holds the guardian's and the
person's public ids, the document key, the sign-in time and its method codes; it is never stored, only its id.
