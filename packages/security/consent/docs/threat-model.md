# Threat model: @stackra/consent

<!--
Stackra file contract:
Purpose: the threat model of @stackra/consent: the visitor's consent decision, the signed consent snapshot the server
         trusts, consent proofs for terms and for another person, and the public snapshot endpoint.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10; ADR 0298; ADR 0454; ADR 0472; ADR 0207 (amendment of 2026-11-26: the ASVS
                    level); STA-1323; STA-316.
-->

ASVS level: L1 for every chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

A visitor's decision lives on their device and proves nothing on its own. The server trusts only a snapshot it signed
(`ConsentSnapshotIssuer`, verified by `ConsentSnapshotVerifier`), and records proofs of terms and of consent given for
someone else through `ConsentProofService`. The threats are tracking without consent and consent that cannot be proven.

## Assets

| Asset                                                    | Where it lives                                               | Class      |
| -------------------------------------------------------- | ------------------------------------------------------------ | ---------- |
| The visitor's decision (categories, version)             | the decision cookie, or `consent.decision` in device storage | `internal` |
| Signed consent snapshots                                 | the `Stackra-Consent` header of each call                    | `internal` |
| Snapshot signing keys                                    | the bound `Signer` (KMS in production), never this package   | `secret`   |
| Consent proofs (subject, giver, relationship, text hash) | the `ConsentProofStore`                                      | `pii`      |
| A guardian's verification reference                      | `ConsentProof.verificationReference`                         | `pii`      |

## Trust boundaries

1. The visitor's device to the public endpoint `POST /public/consent/snapshots` (anonymous, L2, rate-limited).
2. A service call carrying a snapshot to `SnapshotConsentCheckDriver` (`ctx.consent()`).
3. `ConsentProofService` to the proof store and to `ConsentAuthority` and `ConsentVerifier`, which other services implement.

## Threats and controls

| Threat                                                           | Control today                                                                                                                          | Open work                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| A client forges or edits a snapshot to claim consent             | Snapshots are signed by the server's `Signer`; the verifier checks key, signature, lifetime, policy version and Global Privacy Control | —                                                           |
| The issuer signs whatever the client claims                      | The issuer re-applies the rules to the client's record: required categories only granted, GPC and App Tracking refusals win            | —                                                           |
| A stale decision is reused after the policy changes              | A decision counts only for the current `policyVersion` and while younger than `expiryDays`                                             | —                                                           |
| Optional tracking runs before the visitor decides                | `ConsentLedger` answers `undecided`, so nothing optional runs; GPC refuses every optional category                                     | —                                                           |
| An adult consents for a child they have no authority over        | `answerFor` asks `ConsentAuthority` to confirm the relationship and stores it with the proof                                           | —                                                           |
| A guardian consent is recorded without the market's verification | `NoneConsentVerifierDriver` fails every method closed and writes nothing                                                               | A real verifier path, STA-2818                              |
| Consent evidence is lost on restart                              | None: the only `ConsentProofStore` driver in core keeps proofs in memory                                                               | A durable, append-only proof store, STA-2818                |
| The public endpoint is abused for load                           | The pipeline's area and per-address rate limits apply to the anonymous call                                                            | Shared rate-limit stores in deployed environments, STA-2798 |
