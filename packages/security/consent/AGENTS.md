<!--
Stackra file contract:
Purpose: the agent rules of @stackra/consent: where code goes, entries, the consent and proof invariants, PII.
Boundary: documentation only; the user-facing guide is README.md.
Runtime: none (Markdown)
Governing contract: ADR 0298; ADR 0454; OS-284; STA-1323.
-->

# AGENTS — @stackra/consent

Visitor consent: decline by default, Global Privacy Control refuses, the decision stored with its policy version
(ADR 0298). Member at `packages/security/consent` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entries `.`, `./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                     | It goes in…                                         |
| ------------------------------------ | --------------------------------------------------- |
| The configuration (`ConsentConfig`)  | `src/config/consent.config.ts`                      |
| Its schema and shipped `X$`          | `src/core/schemas/`, `src/core/constants/`          |
| A port, its enum and the record type | `src/contracts/{ports,enums,types}/`                |
| A store driver                       | `src/core/drivers/<name>-consent-store.driver.ts`   |
| A region source driver               | `src/core/drivers/<name>-region-source.driver.ts`   |
| A pure read of the ledger            | `src/core/functions/`                               |
| React code                           | `src/react/consent/`                                |
| A test helper                        | `src/testing/functions/`                            |
| A category or regime label           | `assets/lang/<locale>/consent.json` (all 7 locales) |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it      |

## Entries and barrels

- `src/{core,contracts,react,testing,ui}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- The record schema, `parseConsentRecord`, `hasGlobalPrivacyControl` and the storage key stay internal.
- `./ui` renders `@stackra/ui` web components; `./react` stays hooks only. Reject all has the same weight as accept
  all. Legal texts render as plain paragraphs, never as HTML.
- Proofs are append-only and hold ids, never the text; a relationship comes from `ConsentAuthority`, never input.
- A verification method (card check, signed form, guardian login) is named by the market pack, read by the caller, and
  checked by `ConsentVerifier` before anything is written; the stored method and reference are the verifier's answer.
  The shipped verifier is `none` and fails closed; never ship one that passes by default, and never record a consent
  whose verification failed.
- A proof is the consent evidence record (ADR 0454): `evidence` returns the rows as written; never summarise or merge
  them.

## This package

- The rules live in `ConsentLedger` only; a driver stores and never decides.
- Never grant anything optional before a decision unless the region's regime is opt-out and the category says
  `defaultGranted`. Global Privacy Control always refuses. Loosening either is a privacy change and needs review.
- A stored value is untrusted: read it through `parseConsentRecord`, which never throws.
- Consent state is client-only: `useConsent` shows no decision state in a server render; nothing here sets a cookie on
  the server.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

None. The record holds category choices, a policy version and a timestamp; no identifier of the visitor.
