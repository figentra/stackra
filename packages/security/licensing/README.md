# @stackra/licensing

Licensing of ADR 0178, both sides. Keygen holds the licences. The issuing service (OS licensing) writes them through
the `LicenceIssuer` port. An install checks a Keygen signed licence file offline, says where it stands under it
(active, grace, read-only), runs the opt-in online key check when connected, and an on-prem install signs its usage
reports with its own key. Nothing here calls home on its own, and no standing deletes data.

**Tier:** `tier:lib` (`packages/security/licensing`). Entry `.` only. Depends on `@stackra/contracts`,
`@stackra/errors`, `@stackra/support` and `@stackra/transport`.

## What is here

| Symbol                                                                       | Use                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `LicenceVerifier`, `KeygenLicenceVerifierDriver`                             | the port an install verifies through, and its Keygen driver over the config     |
| `LicensingConfig`, `LicensingConfig$`, `LicensingOptions`                    | key `licensing`: `apiUrl` (Keygen hosted by default), `account`, `publicKey`    |
| `verifyLicenceFile`                                                          | checks the Ed25519 signature, decrypts an encrypted file, returns the `Licence` |
| `licenceStanding`                                                            | `active`, `grace` or `read_only` at a given time, after a grace period          |
| `checkLicenceKey`                                                            | Keygen `validate-key`, only for an install that opted in                        |
| `LicenceStanding`                                                            | the three standings                                                             |
| `LicenceFileInvalidError`                                                    | a file that cannot be trusted; `reason` says why                                |
| `LicenceCheckUnavailableError`                                               | Keygen gave no verdict; keep the offline standing                               |
| `Licence`, `LicenceFileOptions`, `LicenceKeyCheck`, `LicenceKeyCheckOptions` | types                                                                           |
| `LicenceIssuer`, `KeygenLicenceIssuerDriver`, `MemoryLicenceIssuerDriver`    | the issuing port (create, renew, check out, suspend) and its two drivers        |
| `IssuerConfig`, `IssuerConfig$`, `IssuerOptions`                             | key `licensing.issuer`: `driver` (`keygen` or `memory`), `productToken` secret  |
| `LicenceIssuerUnavailableError`                                              | Keygen gave no usable answer to an issuing call; retry                          |
| `generateInstallKey`, `installSigner`                                        | an on-prem install's ES256 key: made once, then a `Signer` from its secret      |
| `signUsageReport`, `usageReportMessage`                                      | the usage-report exporter, and the bytes its signature covers                   |
| `LicenceDraft`, `UsageReportPayload`, `SignedUsageReport`, `InstallKey`      | types                                                                           |

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

```ts
import { KeygenLicenceIssuerDriver } from "@stackra/licensing";

const id = await issuer.create({ policyId, name: "Acme on-prem", expiry, metadata }); // Keygen's id
await issuer.update(id, { expiry: renewedTo, metadata }); // renewal or a new snapshot
const file = await issuer.checkOut(id, 30 * 86_400); // a freshly signed file, with entitlements
await issuer.suspend(id); // revoked: the next check and file say so; the install keeps its data
```

`IssuerConfig.driver` picks the driver (`memory` in dev and preview, `keygen` in staging and production). The origin
and account are `LicensingConfig`'s, the same the verifier reads; the product token is the `KEYGEN_PRODUCT_TOKEN`
secret. An install never sets either.

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
