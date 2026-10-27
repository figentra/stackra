# AGENTS — @stackra/licensing

Licensing (ADR 0178): the licence verifier and install signer an install runs, and the licence issuer the issuing
service (OS licensing) runs. Member at `packages/security/licensing` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…  | It goes in…                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| The configuration | `src/config/licensing.config.ts`, schema in `src/core/{schemas,constants}/` |
| A port            | `src/core/ports/<name>.port.ts`                                             |
| A driver          | `src/core/drivers/<name>.driver.ts`                                         |
| A function        | `src/core/functions/<name>.function.ts`                                     |
| A type            | `src/core/types/<name>.type.ts`                                             |
| An enum           | `src/core/enums/<name>.enum.ts`                                             |
| A refusal         | `src/core/errors/<name>.error.ts`                                           |
| A test            | `__tests__/<name>.<kind>.test.ts` beside it                                 |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to `src/core/__tests__/index.test.ts`.
- `decodeBase64`, `decryptLicence`, `isRecord` and `readLicence` stay internal.
- `usageReportMessage` is public on purpose: the install signs and the issuing service verifies the same bytes.

## This package

- No phone-home (ADR 0178 decision 5): `checkLicenceKey` is the only network call an install makes, and only when the
  caller asks. The issuer drivers run only in the issuing service; a usage report leaves an install by hand.
- Expiry is a standing, never a refusal (decision 4). Nothing here deletes or hides data.
- The licence API origin, account and verify key are `LicensingConfig` values; never write an origin in code.
- Web Crypto only (`crypto.subtle`, Ed25519 and AES-GCM); no crypto dependency.
- No parameter properties, no `#private` fields. The one decorator is `@Secret` on `IssuerOptions.productToken`
  (ADR 0173), hence the `decorators-react` and decorators vitest presets.
- The usage-report bytes (`usageReportMessage`) never change: a new form is a new payload `version`.

## PII and secrets

| Data             | Where                                  | Handling                                                                                 |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Licence key      | `verifyLicenceFile`, `checkLicenceKey` | Used to decrypt or sent in the body to Keygen; never stored, logged or put in a refusal. |
| Verify key       | `verifyLicenceFile`                    | Public; never a secret.                                                                  |
| Licence metadata | `Licence.metadata`                     | Returned as the signed file states it; never logged here.                                |
| Product token    | `IssuerConfig.productToken`            | `KEYGEN_PRODUCT_TOKEN` secret; sent as the bearer only; never logged or in a refusal.    |
| Install key      | `generateInstallKey`, `installSigner`  | Private JWK returned once for the secret store; imported non-extractable; never quoted.  |
