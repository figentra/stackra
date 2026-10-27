<!-- Stackra file contract. Purpose: agent rules for @stackra/licensing. Boundary: documentation only. Runtime: documentation. Governing contract: ADR 0178; ADR 0294; ADR 0453 (decisions 14 and 15); ADR 0461 (decision 4). -->

# AGENTS — @stackra/licensing

Licensing (ADR 0178): the licence verifier and install signer an install runs, and the licence issuer the issuing
service (OS licensing) runs. Member at `packages/security/licensing` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `.` and `./contracts` (the leaf: types only, the registry licence API of ADR 0453
decision 14; it imports no other entry). Free, never moved to `@stackra-pro` (ADR 0461 decision 4).

## Where code goes

| You are writing…  | It goes in…                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| The configuration | `src/config/licensing.config.ts`, schema in `src/core/{schemas,constants}/`   |
| A port            | `src/core/ports/<name>.port.ts`                                               |
| A driver          | `src/core/drivers/<name>.driver.ts`                                           |
| A function        | `src/core/functions/<name>.function.ts`                                       |
| A type            | `src/core/types/<name>.type.ts`                                               |
| A wire contract   | `src/contracts/types/<name>.type.ts`, re-exported by `src/contracts/index.ts` |
| An enum           | `src/core/enums/<name>.enum.ts`                                               |
| A refusal         | `src/core/errors/<name>.error.ts`                                             |
| A test            | `__tests__/<name>.<kind>.test.ts` beside it                                   |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to `src/core/__tests__/index.test.ts`.
- `decryptLicence` and `readLicence` stay internal. `decodeBase64` and `isRecord` are `@stackra/support`'s (stackra-224):
  `decodeBase64` answers `undefined` for bad text, so a caller refuses with `malformed` itself.
- `usageReportMessage` is public on purpose: the install signs and the issuing service verifies the same bytes.

## This package

- No phone-home (ADR 0178 decision 5): `checkLicenceKey` is the only network call an install makes, and only when the
  caller asks. The issuer drivers run only in the issuing service; a usage report leaves an install by hand.
- Expiry is a standing, never a refusal (decision 4). Nothing here deletes or hides data.
- The licence API origin, account and verify key are `LicensingConfig` values, and the registry origin is
  `IssuerConfig.registryUrl`; never write an origin in code.
- `registry` is the default issuer driver; `keygen` stays, optional, for on-prem. The registry licence API's shapes
  live only in `./contracts`; `workers/registry` imports them, so change them there first and keep both in step.
- Web Crypto only (`crypto.subtle`, Ed25519 and AES-GCM); no crypto dependency.
- No parameter properties, no `#private` fields. The decorators are `@Secret` on `IssuerOptions.productToken` and
  `IssuerOptions.issuerToken` (ADR 0173), hence the `decorators-react` and decorators vitest presets.
- The usage-report bytes (`usageReportMessage`) never change: a new form is a new payload `version`.

## PII and secrets

| Data             | Where                                  | Handling                                                                                 |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Licence key      | `verifyLicenceFile`, `checkLicenceKey` | Used to decrypt or sent in the body to Keygen; never stored, logged or put in a refusal. |
| Verify key       | `verifyLicenceFile`                    | Public; never a secret.                                                                  |
| Licence metadata | `Licence.metadata`                     | Returned as the signed file states it; never logged here.                                |
| Product token    | `IssuerConfig.productToken`            | `KEYGEN_PRODUCT_TOKEN` secret; sent as the bearer only; never logged or in a refusal.    |
| Issuer token     | `IssuerConfig.issuerToken`             | `REGISTRY_ISSUER_TOKEN` secret; sent as the bearer only; never logged or in a refusal.   |
| Licence token    | `RegistryLicence.issuedToken`          | `stkl_…`, answered once by issue or addToken; pass it to the customer, never store it.   |
| Install key      | `generateInstallKey`, `installSigner`  | Private JWK returned once for the secret store; imported non-extractable; never quoted.  |
