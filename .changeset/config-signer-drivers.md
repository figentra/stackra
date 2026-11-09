---
"@stackra/config": minor
---

A service that injects @stackra/contracts' `Signer` can now pass gen. Before this, it failed with `port_unbound`, because no manifest listed a driver for the port. @stackra/config adds two `Driver(Signer)` drivers, configured by `SignerConfig` (`config.signer`: `keyId`, `kmsKeyId`, `region`):

- `KmsSignerDriver` (`kms`) signs inside AWS KMS through the new `KmsClient` port in `./contracts`. Its default driver, `aws-sdk` (`AwsSdkKmsClientDriver` in `./node`), builds `new KMS({ region })` from `@aws-sdk/client-kms`, an optional peer, on first use; a host may bind its own.
- `EphemeralSignerDriver` (`ephemeral`) uses a key pair made in process, for tests and local development.

@stackra/contracts' `AwsKmsSignerDriver` and `MemorySignerDriver` are unchanged for code that builds a signer by hand.

Bump step for a service that injects `Signer`: bind `kms` in production, set `config.signer.kmsKeyId` (and `region`) in runway, and add `@aws-sdk/client-kms` to its dependencies.
