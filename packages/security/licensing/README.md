<!-- Stackra file contract. Purpose: the README of @stackra/licensing: the verifier, the install signer, the issuer port and its registry (default), Keygen and memory drivers, and the registry licence API contract. Boundary: documentation only. Runtime: documentation. Governing contract: ADR 0178; ADR 0453 (decisions 13 to 15); ADR 0461 (decision 4). -->

# @stackra/licensing

Licensing of ADR 0178 and ADR 0453, both sides; free (ADR 0461 decision 4). The issuing service (OS licensing and
billing) writes licences through the `LicenceIssuer` port: by default into the Stackra registry's own licence engine
(`registry` driver), or into Keygen for an on-prem customer who runs it (`keygen` driver). An install checks a Keygen signed licence file offline, says where it stands under it
(active, grace, read-only), runs the opt-in online key check when connected, and an on-prem install signs its usage
reports with its own key. Nothing here calls home on its own, and no standing deletes data.

**Tier:** `tier:lib` (`packages/security/licensing`). Entries `.` and `./contracts` (types only: the registry licence
API). Depends on `@stackra/contracts`,
`@stackra/errors`, `@stackra/support` and `@stackra/transport`.

## What is here

| Symbol                                                                                                   | Use                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `LicenceVerifier`, `KeygenLicenceVerifierDriver`                                                         | the port an install verifies through, and its Keygen driver over the config                                                        |
| `LicensingConfig`, `LicensingConfig$`, `LicensingOptions`                                                | key `licensing`: `apiUrl` (Keygen hosted by default), `account`, `publicKey`                                                       |
| `verifyLicenceFile`                                                                                      | checks the Ed25519 signature, decrypts an encrypted file, returns the `Licence`                                                    |
| `licenceStanding`                                                                                        | `active`, `grace` or `read_only` at a given time, after a grace period                                                             |
| `checkLicenceKey`                                                                                        | Keygen `validate-key`, only for an install that opted in                                                                           |
| `LicenceStanding`                                                                                        | the three standings                                                                                                                |
| `LicenceFileInvalidError`                                                                                | a file that cannot be trusted; `reason` says why                                                                                   |
| `LicenceCheckUnavailableError`                                                                           | Keygen gave no verdict; keep the offline standing                                                                                  |
| `Licence`, `LicenceFileOptions`, `LicenceKeyCheck`, `LicenceKeyCheckOptions`                             | types                                                                                                                              |
| `LicenceIssuer`, `RegistryLicenceIssuerDriver`, `KeygenLicenceIssuerDriver`, `MemoryLicenceIssuerDriver` | the issuing port (create, renew, check out, suspend) and its three drivers                                                         |
| `IssuerConfig`, `IssuerConfig$`, `IssuerOptions`                                                         | key `licensing.issuer`: `driver` (`registry` default, `keygen`, `memory`), `registryUrl`, `issuerToken` and `productToken` secrets |
| `LicenceIssuerUnavailableError`                                                                          | the issuer API gave no usable answer to an issuing call; retry                                                                     |

`./contracts` (types only, the OS billing hook of ADR 0453 decision 14): `RegistryLicenceCommand` (issue, renew,
setGrants, suspend, resume, revoke, addToken, revokeToken, each with its `idempotencyKey`), `RegistryLicence` (what
every licence API call answers; `issuedToken` is set once), `RegistryLicenceGrant` (`{ scope, names: "*" | names }`)
and `RegistryLicenceToken`.
| `generateInstallKey`, `installSigner` | an on-prem install's ES256 key: made once, then a `Signer` from its secret |
| `signUsageReport`, `usageReportMessage` | the usage-report exporter, and the bytes its signature covers |
| `LicenceDraft`, `UsageReportPayload`, `SignedUsageReport`, `InstallKey` | types |

## Verifying an install offline

```ts
import { Duration } from "@stackra/contracts";
import { LicenceStanding, licenceStanding, verifyLicenceFile } from "@stackra/licensing";

const licence = await verifyLicenceFile(file, {
  publicKey: keygenVerifyKey, // the account's Ed25519 verify key, 64 hex characters (public)
  licenceKey, // only for an `aes-256-gcm+ed25519` file
});

switch (licenceStanding(licence, Duration.days(14), clock.now())) {
  case LicenceStanding.Active:
    break;
  case LicenceStanding.Grace:
    banner.warn("Your licence expired; renew within the grace period.");
    break;
  case LicenceStanding.ReadOnly:
    admin.readOnly(); // data is kept; no new seats
}

licence.entitlements; // ["SSO", "AUDIT_LOG"]: what an on-prem install is entitled to (EN6)
```

The standing counts from the earlier of the licence's expiry and the file's own expiry (Keygen's check-out TTL). A
licence the file marks `SUSPENDED` or `BANNED` is read-only at once.

## The opt-in online check

```ts
import { checkLicenceKey } from "@stackra/licensing";

const check = await checkLicenceKey({ account, licenceKey, fingerprint, transport });
check.valid; // false with check.code "EXPIRED", "SUSPENDED", "TOO_MANY_MACHINES", ...
```

`LicenceCheckUnavailableError` means Keygen did not answer; the install keeps its offline standing.

## Configuration, not code

The licence API origin is configuration: `LicensingConfig.apiUrl` defaults to Keygen's hosted API and an air-gapped
install points it at its own server. `checkLicenceKey` without a `baseUrl` reads that default; no origin is a constant
in code.

```ts
export class LicensingConfig extends BaseLicensingConfig {
  override account = "figentra";
  override publicKey = "e8601e48…"; // the account's Ed25519 verify key, public
}
// const licence = await container.get(LicenceVerifier).verify(file);
```

## Issuing licences (the issuing service only)

The default `registry` driver calls the Stackra registry licence API (`IssuerConfig.registryUrl`, default
`https://npm.stackra.figentra.com`) with the `REGISTRY_ISSUER_TOKEN` secret. OS billing sends commands with the
billing event id as the Idempotency-Key, so a retried webhook is applied once:

```ts
import { RegistryLicenceIssuerDriver } from "@stackra/licensing";
import type { RegistryLicenceCommand } from "@stackra/licensing/contracts";

const licence = await issuer.apply({
  action: "issue",
  idempotencyKey: event.id,
  holderRef: account.ref,
  grants: [{ scope: "@stackra-pro", names: "*" }],
  notBefore: null,
  expiresAt: "2027-11-01T00:00:00.000Z",
  tokenLabel: "github-actions",
});
licence.issuedToken; // "stkl_…": hand it to the customer once; it is never answered again
await issuer.apply({ action: "suspend", idempotencyKey: failedPayment.id, licenceId: licence.id });
```

Subscription start is `issue`, renewal `renew`, failed payment `suspend`, cancellation or refund `revoke`, a plan change
`setGrants`. Through the port, `create` reads `holderRef` and `grants` (and an optional `idempotencyKey`) from the
draft's metadata; `checkOut` is refused: an offline file for on-prem comes from the `keygen` driver.

The optional `keygen` driver, for an on-prem customer who runs Keygen:

```ts
import { KeygenLicenceIssuerDriver } from "@stackra/licensing";

const id = await issuer.create({ policyId, name: "Acme on-prem", expiry, metadata }); // Keygen's id
await issuer.update(id, { expiry: renewedTo, metadata }); // renewal or a new snapshot
const file = await issuer.checkOut(id, 30 * 86_400); // a freshly signed file, with entitlements
await issuer.suspend(id); // revoked: the next check and file say so; the install keeps its data
```

`IssuerConfig.driver` picks the driver (`memory` in dev and preview, `registry` in staging and production, `keygen`
for an on-prem Keygen). Keygen's origin and account are `LicensingConfig`'s, the same the verifier reads; the product
token is the `KEYGEN_PRODUCT_TOKEN` secret. An install never sets any of them.

## Usage reports from an on-prem install

```ts
import { generateInstallKey, installSigner, signUsageReport } from "@stackra/licensing";

// Once, at install time: keep the private key as a secret, give the public key to the operator to register.
const { privateKey, publicKey } = await generateInstallKey("acme-onprem-1");

// Each period: sign and export the report the operator uploads.
const signer = await installSigner("acme-onprem-1", installKeySecret);
const report = await signUsageReport(
  {
    version: 1,
    licenceId,
    periodStart: "2027-01-01T00:00:00.000Z",
    periodEnd: "2027-04-01T00:00:00.000Z",
    lines,
  },
  signer,
);
```

The signature covers `usageReportMessage(payload)`, the canonical JSON of the payload; the issuing service verifies
the same bytes with `verifySignature` of `@stackra/contracts` and the registered public key.

## Not here

- Deciding when to issue, the licence terms and the true-up: the issuing service (OS licensing, ADR 0178 decision 2).
- Counting usage per meter: the install's metering hands `signUsageReport` its lines.
- The file signing key: Keygen and Infisical KMS hold it; this package only ever sees the public verify key.
- Checking the `Keygen-Signature` of the online response; the signed offline file stays the source of truth.
- The registry's offline licence file for on-prem, signed with its own `LICENCE_SIGNING_KEY` (ADR 0453 decision 15):
  not built; the `registry` driver refuses `checkOut`.
- The licence engine itself: `workers/registry` (`/-/stackra/v1/licences`).
