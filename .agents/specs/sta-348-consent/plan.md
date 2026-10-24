# Plan: `@stackra/consent` wave 3

**Spec**: `.agents/specs/sta-348-consent/spec.md`

## Design

- `ConsentStore` port (`src/contracts/ports/`): synchronous storage only, `read()`, `write(record)`, `clear()`, over the
  `ConsentRecord` type (`policyVersion`, `decidedAt`, `categories` by code). Exported from `./contracts`.
- Three drivers in `src/core/drivers/`: `CookieConsentStoreDriver` (the decision cookie, browser only),
  `StorageConsentStoreDriver` (`consent.decision` in the `prefs` area of `@stackra/storage`, `expiryDays` TTL) and
  `MemoryConsentStoreDriver`. Each parses what it reads through `parseConsentRecord` (internal, zod, never throws).
- `ConsentOptions` (shape) registers `CONSENT_CONFIG_SCHEMA` (field rules only, every field defaulted, so gen can
  `.extend` it); `ConsentConfig` is `Config({ schema: ConsentOptions })`; the barrel exports the schema as
  `ConsentConfig$`.
- `ConsentLedger` (`src/core/services/`, `extends Service`) holds the rules of ADR 0298 in one place: required, Global
  Privacy Control (`hasGlobalPrivacyControl`, internal), the stored decision for the current policy version within
  `expiryDays`, then the region's regime. It writes through the store, counts changes (`revision`) and notifies
  subscribers.
- `useConsent` (`./react`) reads the container's ledger with `useSyncExternalStore`; its server snapshot is "not
  loaded", so the server render and hydration show only what a server knows (required granted, the rest undecided).
- `fakeConsent` (`./testing`) is a real ledger over the default configuration and the memory driver.
- `assets/lang/{en,ar}/consent.json` label the enum (`consent::enums.consent_category.<code>`).

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/consent`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/storage`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                     |
| Security                              | PASS   | stored values are parsed at the trust boundary and never throw; Global Privacy Control refuses                                                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                                            |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                          |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                  |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                        |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                               |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                       |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                         |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                      |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                 |

- Boundaries: imports `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/storage`,
  `@stackra/validation`, `zod` and React only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; one declaration per file.
- Secrets and PII: none; the record holds no visitor identifier.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react` and `./testing`, and `src/contracts/` imports no other entry — Validates: FR-001
- **P-002**: `.` exports `ConsentCategory`, `ConsentConfig`, `ConsentConfig$`, `ConsentRegime`, `ConsentStatus`, `CookieConsentStoreDriver`, `ConsentLedger`, `ConsentOptions`, `StorageConsentStoreDriver`, `MemoryConsentStoreDriver` and the type `ConsentCategoryEntry` — Validates: FR-002
- **P-003**: `./contracts` exports `ConsentStore` and `ConsentRecord`, `./react` exports `useConsent` with `CategoryConsent` and `ConsentState`, and `./testing` exports `fakeConsent` — Validates: FR-003
- **P-004**: `ConsentLedger` decides in order: a required category is granted, Global Privacy Control refuses, a stored decision for the current policy version within `expiryDays` wins, the region's regime applies (`ccpa` grants a `defaultGranted` category), and otherwise the status is `undecided` and nothing is granted — Validates: FR-004
- **P-005**: a stored value that fails its zod schema is treated as absent and never throws — Validates: FR-005
- **P-006**: `useConsent` returns the same no-decision state in a server render and in the hydration pass, so the markup matches — Validates: FR-006
