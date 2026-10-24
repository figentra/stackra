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

## Constitution check

- Boundaries: imports `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/storage`,
  `@stackra/validation`, `zod` and React only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; one declaration per file.
- Secrets and PII: none; the record holds no visitor identifier.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).
