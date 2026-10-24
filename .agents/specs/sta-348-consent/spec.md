# Feature Specification: `@stackra/consent` wave 3, visitor consent with decline by default and Global Privacy Control

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/consent` (security, wave 3) for real: the consent store, decline by default, Global Privacy
Control refuses (ADR 0298).

## Impact

- **Apps touched**: none (the template's web and mobile apps consume it)
- **Services touched**: none
- **Packages touched**: `packages/security/consent` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables; the decision lives only in the client (a first-party cookie or the `prefs` area)
- **Secrets**: none
- **ADR needed**: no (ADR 0298, 0256, 0294, 0305)
- **New dependencies**: none new; `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/storage`,
  `@stackra/validation` through `workspace:*`; `zod` through `catalog:`; `jsdom` and `@testing-library/*` (tests only)
  through `catalog:frontend`
- **Deploy modes**: same in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/consent/README.md`, `packages/security/consent/AGENTS.md`; ADR 0120, 0127, 0256, 0294, 0298, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (privacy behaviour; no stored server data)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entries `.`, `./contracts`, `./react`, `./testing`; depends on
  storage and config; ADR 0298 decisions 1 to 6; ADR 0127 settlement: category security

## User Scenarios & Testing

### User Story 1 - A visitor decides on the web banner (Priority: P1)

The template's banner reads `useConsent(ConsentCategory.Analytics)`: nothing until the decision is read, nothing once
decided, and `grant`, `deny`, `reset` to change it. The decision is the one cookie a page sets.

**Independent Test**: `src/react/consent/__tests__/use-consent.test.tsx`,
`src/core/drivers/__tests__/cookie-consent-store.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** no decision, **When** the banner renders on the client, **Then** `isLoaded` is true and `status` is
   `undecided`; in a server render `isLoaded` is false.
2. **When** the visitor accepts, **Then** the `consent` cookie holds the policy version, the instant and
   `{ analytics: true }`, with `Path=/`, `Max-Age` of `expiryDays`, `SameSite=Lax` and `Secure` on HTTPS.
3. **Given** a stored decision for an older policy version, **Then** the category reads `undecided` again.

### User Story 2 - Global Privacy Control refuses (Priority: P1)

**Independent Test**: `src/core/services/__tests__/consent-ledger.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** `navigator.globalPrivacyControl === true`, **Then** every optional category is `denied`, under every
   regime and whatever is stored; `necessary` stays `granted`.

### User Story 3 - A user decides in device settings (Priority: P1)

The template's mobile settings page reads `useConsent()` and renders one switch per configured category: `isGranted`,
`set(category, on)`; the decision is kept in the `prefs` area.

**Independent Test**: `src/core/drivers/__tests__/storage-consent-store.driver.test.ts`,
`src/testing/functions/__tests__/fake-consent.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `fakeConsent()`, **Then** analytics is not granted; after `set(Analytics, true)` analytics is granted and
   crash replay is not.
2. **Given** `set(Necessary, false)`, **Then** necessary stays granted and nothing is stored.

### User Story 4 - Configure categories and regions (Priority: P2)

A host overrides `ConsentConfig` (`categories`, `cookieName`, `expiryDays`, `policyVersion`, `regionDefaults`,
`askOnFirstLaunch`); gen extends `ConsentConfig$` field by field.

**Independent Test**: `src/config/__tests__/consent.config.test.ts`.

## Requirements

- **FR-001**: Four entries, `.`, `./contracts`, `./react`, `./testing` (registry row, ADR 0294 decision 15);
  `./contracts` imports no other entry.
- **FR-002**: `.` exports `ConsentCategory`, `ConsentConfig`, `ConsentConfig$`, `ConsentRegime`, `ConsentStatus` (the
  registry row) and `CookieConsentStoreDriver` (the gen wiring), with `ConsentLedger`, `ConsentOptions`,
  `StorageConsentStoreDriver`, `MemoryConsentStoreDriver` and the type `ConsentCategoryEntry`.
- **FR-003**: `./contracts` exports `ConsentStore` and the type `ConsentRecord`; `./react` exports `useConsent` and the
  types `CategoryConsent`, `ConsentState`; `./testing` exports `fakeConsent`.
- **FR-004**: The rules, in order: required granted; Global Privacy Control refuses; a stored decision for the current
  policy version within `expiryDays`; the region's regime (`ccpa` grants a `defaultGranted` category); otherwise
  `undecided`, which grants nothing.
- **FR-005**: A stored value is parsed with a zod schema at the trust boundary and never throws.
- **FR-006**: Consent state is client-only: `useConsent` shows no decision state in a server render or hydration pass.

## Success Criteria

- **SC-001** (template imports): `ConsentCategory`, `ConsentConfig` (with `categories` entries of `category`,
  `required`, `defaultGranted`, `descriptionKey`; `cookieName`, `expiryDays`, `policyVersion`, `regionDefaults`,
  `askOnFirstLaunch`), `ConsentRegime.Gdpr`, `ConsentStatus.Undecided`/`Granted`, `ConsentConfig$` with `.shape.<field>
.unwrap().default(...)`, `CookieConsentStoreDriver` from `.`; `ConsentStore` from `./contracts`; `useConsent(category)`
  returning `isLoaded`, `status`, `grant`, `deny`, `reset` and `useConsent()` returning `isGranted`, `set` from
  `./react`; `fakeConsent()` returning an object with `isGranted` from `./testing`.
- **SC-002** (registry contract): entries `.`, `./contracts`, `./react`, `./testing`; decline by default; GPC refuses;
  depends on storage and config.
- **SC-003**: every public symbol has a test beside it; the barrel tests pin each entry's exports; the category labels
  exist in `assets/lang/en` and `assets/lang/ar`.
- **SC-004**: format and lint pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- The analytics queue (ADR 0298 decision 5): `@stackra/analytics` watches `ConsentLedger.subscribe`.
- Detecting the visitor's region: the host calls `ConsentLedger.setRegion` when it knows it.
- Syncing a decision across browser tabs.
- A `ConsentProvider` component: the registry row's `./react` entry is `useConsent` only; the ledger comes from the
  container.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
