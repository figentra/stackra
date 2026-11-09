---
"@stackra/config": minor
---

A service that injects @stackra/contracts' `Signer` can now pass gen. Before this, it failed with `port_unbound`, because no manifest listed a driver for the port. @stackra/config adds two `Driver(Signer)` drivers, configured by `SignerConfig` (`config.signer`: `keyId`, `kmsKeyId`):

- `KmsSignerDriver` (`kms`) signs inside AWS KMS through the new `KmsClient` port in `./contracts`. The host binds `KmsClient` with a driver that wraps `new KMS({ region })`.
- `EphemeralSignerDriver` (`ephemeral`) uses a key pair made in process, for tests and local development.

@stackra/contracts' `AwsKmsSignerDriver` and `MemorySignerDriver` are unchanged for code that builds a signer by hand.

Bump step for a service that injects `Signer`: bind `kms` in production, set `config.signer.kmsKeyId` in runway, and bind a `KmsClient` driver.
