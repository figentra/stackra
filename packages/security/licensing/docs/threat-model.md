# Threat model: @stackra/licensing

<!--
Stackra file contract:
Purpose: the threat model of @stackra/licensing: offline verification of a signed licence file, the standing it gives
         an install, the opt-in online key check, the issuer port and its drivers, and signed usage reports.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10; ADR 0178; ADR 0453 (decisions 13 to 15); ADR 0461 (decision 4); ADR 0207
                    (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter; V6 (stored cryptography) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

An install verifies its licence offline and derives a standing (active, grace, read-only); the issuing service writes
licences through the `LicenceIssuer` port. Nothing here calls home on its own and no standing deletes data. The threats
are a forged or tampered licence, a leaked issuing token, and a licence key exposed in transit or logs.

## Assets

| Asset                             | Where it lives                                                                 | Class          |
| --------------------------------- | ------------------------------------------------------------------------------ | -------------- |
| Licence keys                      | the customer's install; used to decrypt a file or sent to Keygen, never stored | `secret`       |
| Issuer and product tokens         | `REGISTRY_ISSUER_TOKEN`, `KEYGEN_PRODUCT_TOKEN`, read blind                    | `secret`       |
| Issued registry licence tokens    | `RegistryLicence.issuedToken`, answered once                                   | `secret`       |
| An on-prem install's private key  | the install's secret store, imported non-extractable                           | `secret`       |
| Licence metadata and entitlements | the signed licence file                                                        | `confidential` |
| The account's verify key          | `LicensingConfig.publicKey`                                                    | `internal`     |

## Trust boundaries

1. A licence file supplied to the install (untrusted until verified).
2. The install to Keygen's API (opt-in key check).
3. The issuing service to the Stackra registry licence API or Keygen.
4. An on-prem install's signed usage reports to Figentra.

## Threats and controls

| Threat                                       | Control today                                                                                                                       | Open work |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A forged or edited licence file              | `verifyLicenceFile` checks the Ed25519 signature against the account's verify key before reading anything; failures name a reason   | —         |
| An expired licence kept alive by an old file | The standing counts from the earlier of the licence's and the file's own expiry; `SUSPENDED` or `BANNED` is read-only at once       | —         |
| A licence key leaks through logs or refusals | The key is used to decrypt or sent in a request body only; never stored, logged or put in an error                                  | —         |
| A leaked issuer token issues licences        | The tokens are `@Secret`s, sent as the bearer only; every command carries an idempotency key; the registry keeps the issuing record | —         |
| An issued token is stored and later stolen   | `issuedToken` is answered once by issue or `addToken`, for the customer; it is never stored here                                    | —         |
| A forged usage report                        | Reports are signed with the install's ES256 key, imported non-extractable; `usageReportMessage` fixes the signed bytes              | —         |
| A Keygen outage locks a paying customer out  | `LicenceCheckUnavailableError` keeps the offline standing; no standing deletes data                                                 | —         |
