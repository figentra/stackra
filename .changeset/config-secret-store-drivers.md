---
"@stackra/config": minor
---

Add the `InfisicalSecretStoreDriver` with `InfisicalConfig` and the `AwsSecretsManagerSecretStoreDriver` (`./node`) with
`AwsSecretsManagerConfig`; both load once at boot and never list or report a value. `@aws-sdk/client-secrets-manager`
is an optional peer.
