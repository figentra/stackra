---
"@stackra/config": patch
"@stackra/contracts": patch
---

`SignerConfig` has a `driver` field that picks the `Signer` driver: `ephemeral` by default, or `kms`. Before, no config field selected one, so a member that injected `Signer` (os audit) failed to boot with `UnresolvedPortError: ... its drivers are ephemeral, kms, and no config field selects one`, in production too.

Production sets `driver: kms` with `kmsKeyId` in its runway values. `Signer` also declares its type-only port key (`contracts.Signer`), so `DriverName<Signer>` narrows to these two names.

`SecretsConfig` is new: keyed `secrets` in this package, and exported with `SecretsConfig$` and `SecretsOptions`. Its `store` field picks the `SecretStore` driver: `memory` by default, or `aws_secrets_manager`. Nothing selected one before, and no runway environment sets one today, so `memory` keeps today's boots. A deployment that reads AWS Secrets Manager sets `store: aws_secrets_manager` in its runway values.
