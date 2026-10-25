# Feature Specification: security packages extension (identity, iam, entitlements, scope, tenancy, licensing, consent, csp)

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing (owner mode: code and tests written, not run)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Clarifications status**: defaults applied (owner instruction "apply the recommended approach")

**Input**: the rows of `notes/handover/stackra-package-needs.md` for `@stackra/identity`, `iam`, `entitlements`,
`scope`, `tenancy`, `licensing`, `consent` and `csp`; the Verification (KYC/KYB) port homed in identity with drivers
selected by market-pack data; the seat-kind meter in entitlements (XP-1 passed). Conflicts applied as recommended:
one-time codes stay in `@stackra/validation`, the device registry in `@stackra/devices`, the e-signature port in
`@stackra/documents`, loyalty points on `@stackra/loyalty-kit` (none of them touched here).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/security/{identity,iam,entitlements,scope,tenancy,licensing,consent,csp}`
- **Cross-service events**: none new; `decodePolicySnapshot` reads the IAM service's snapshot event payload
- **Tenancy and data**: no table or migration; sandbox tenants and shares are ports with memory drivers, the OS
  services own the tables
- **Secrets**: none; staff PINs are salted PBKDF2 hashes in the device `secrets` area, API keys are minted and parsed only
- **ADR needed**: national IdP ADR (row says "config and ADR"), the sandbox-tenant and share ports' OS homes, and a
  pipeline commit hook for reserve-then-commit are owner questions; no ADR written
- **New dependencies**: `expo-web-browser` (needs a `catalog:mobile` entry); workspace edges entitlements to locking,
  scope to storage, identity to market-packs, consent to ui, i18n and errors, licensing to config, container,
  validation and zod
- **Lane**: full; **Change risk**: R3 (authentication, authorisation and consent evidence)

## Row items and where they landed

| Package      | Item                                            | Home                                                                       |
| ------------ | ----------------------------------------------- | -------------------------------------------------------------------------- |
| csp          | Security headers on by default                  | `securityHeaders`, new `CspConfig` fields                                  |
| licensing    | Verifier port; Keygen URL not hard-coded        | `LicenceVerifier`, `KeygenLicenceVerifierDriver`, `LicensingConfig.apiUrl` |
| scope        | Gate-A publish; `./native`, `./testing`         | `private` removed; `rememberActiveScope`; `scopeRefOf`, `fakeScopeTree`    |
| entitlements | Soft limits, grace                              | `LimitGrant`, `limitAllows`, plan driver                                   |
| entitlements | Reserve-then-commit                             | `LimitReservationService` (locking)                                        |
| entitlements | `EntitlementSource` to contracts and a driver   | `./contracts`, `PlanSnapshotEntitlementSourceDriver`, `PlanSnapshots`      |
| entitlements | Seat-kind meter (XP-1)                          | `SeatMeterService`, `SeatLedger`                                           |
| tenancy      | Sandbox tenants                                 | `TenantEnvironment`, `SandboxTenantService`, `SandboxTenants`              |
| tenancy      | Cross-tenant links, consented copies (ADR 0343) | `TenantShareService`, `TransferCheck`, `revocationPlan`                    |
| consent      | Versioned terms, server proof store             | `ConsentProofService`, `ConsentProofStore`                                 |
| consent      | Legal-page and cookie UI                        | `./ui`: `ConsentBanner`, `ConsentPreferences`, `LegalPage`, `TermsPrompt`  |
| consent      | Consent on behalf of another, with version      | `answerFor`, `ConsentAuthority`, `needsGuardianConsent`                    |
| iam          | Production `PolicySource`                       | `StorePolicySourceDriver`, `PolicySnapshotStore`, `decodePolicySnapshot`   |
| iam          | Field-level enforcement                         | `FieldRule`, `pdp.fieldAccess`, `redactFields`, `assertFieldsWritable`     |
| iam          | Conditions on other services' dimensions        | `registerDimensions`, `DimensionValues` (ADR 0351)                         |
| iam          | Visibility with relations, counts, aggregates   | already shipped (`IamVisibilityFilterDriver`); facets: see below           |
| iam          | Time-boxed break-glass                          | `BreakGlassGrant`, `breakGlassGrant`, `DenyRule.breakable`                 |
| iam          | Existence-only hits                             | `Capability.Exists`, `existenceHit`                                        |
| iam          | Restricted, never self-granted permissions      | `Permission.Lx.restricted()`, `Grant.grantedBy`                            |
| identity     | National IdPs (config)                          | `externalProviders`, `signInProvidersOf`, `externalSignIn`                 |
| identity     | Step-up                                         | `AssuranceLevel`, `assuranceOf`, `requireAssurance`, `stepUpSignIn`        |
| identity     | `SignInBrowser` drivers                         | `./native` Expo, `./desktop` Electron loopback                             |
| identity     | Staff PIN quick-switch, manager override        | `StaffPinService`, `StaffPinStore`                                         |
| identity     | Publishable origin-bound API key                | `ApiKeyKind`, `mintApiKey`, `parseApiKey`, `checkPublishableKey`           |
| identity     | Guardian acting for a minor                     | `GuardianActingService`, `Guardianship`                                    |
| identity     | Verification (KYC/KYB) port                     | `Verification`, `VerificationService` (providers from market-pack data)    |

## Not built

- Vendor KYC/KYB drivers (Wathq, ZATCA lookup, Nafath, UAE Pass, Uqudo, Sumsub, ComplyAdvantage): their API contracts
  and sandbox credentials are not in the repo; the port, the selection and a memory driver are.
- Filtered facets: search computes facets in `@stackra/search`, which must read `VisibilityFilter`; not this package.
- A Postgres `PolicySnapshotStore` driver and its migration: the IAM service decides the table.
