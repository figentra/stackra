---
"@stackra/config": minor
"@stackra/app": minor
"@stackra/platform": minor
"@stackra/integrations": minor
"@stackra/filesystem": minor
---

Secrets now come from SOPS files keyed by Google Cloud KMS, not Infisical (ADR 0525). `@stackra/config` no longer
ships the Infisical secret store: `InfisicalSecretStoreDriver`, `InfisicalConfig`, `InfisicalConfig$` and
`InfisicalOptions` are removed, with the `infisical` candidate of the `SecretStore` port and the
`INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` env rows. The `SecretStore` candidates are now `memory` and
`aws_secrets_manager`; a deployed runtime still reads the platform's own store through `envSecrets`. Re-run
`stackra gen` after upgrading so a committed `stackra.manifest.json` drops the `infisical` candidate. The other
packages only update comments and docs that named Infisical as the runtime store.
