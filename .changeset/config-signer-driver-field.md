---
"@stackra/config": patch
"@stackra/contracts": patch
---

`SignerConfig` has a `driver` field that picks the `Signer` driver: `ephemeral` by default, or `kms`. Before, no config field selected one, so a member that injected `Signer` (os audit) failed to boot with `UnresolvedPortError: ... its drivers are ephemeral, kms, and no config field selects one`, in production too.

Production sets `driver: kms` with `kmsKeyId` in its runway values. `Signer` also declares its type-only port key (`contracts.Signer`), so `DriverName<Signer>` narrows to these two names.
