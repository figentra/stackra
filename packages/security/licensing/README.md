# @stackra/licensing

The licence verifier of ADR 0178. Keygen holds the licences; this package checks a Keygen signed licence file offline,
says where the install stands under it (active, grace, read-only), and runs the opt-in online key check for a
connected install. It never calls home on its own, and no standing deletes data.

**Tier:** `tier:lib` (`packages/security/licensing`). Entry `.` only. Depends on `@stackra/contracts`,
`@stackra/errors` and `@stackra/transport`.

## What is here

| Symbol                                                                       | Use                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `verifyLicenceFile`                                                          | checks the Ed25519 signature, decrypts an encrypted file, returns the `Licence` |
| `licenceStanding`                                                            | `active`, `grace` or `read_only` at a given time, after a grace period          |
| `checkLicenceKey`                                                            | Keygen `validate-key`, only for an install that opted in                        |
| `LicenceStanding`                                                            | the three standings                                                             |
| `LicenceFileInvalidError`                                                    | a file that cannot be trusted; `reason` says why                                |
| `LicenceCheckUnavailableError`                                               | Keygen gave no verdict; keep the offline standing                               |
| `Licence`, `LicenceFileOptions`, `LicenceKeyCheck`, `LicenceKeyCheckOptions` | types                                                                           |

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

## Not here

- Issuing, renewing and revoking licences: the billing-to-Keygen webhook (ADR 0178 decision 2).
- The signing key: Keygen and Infisical KMS hold it; this package only ever sees the public verify key.
- Checking the `Keygen-Signature` of the online response; the signed offline file stays the source of truth.
