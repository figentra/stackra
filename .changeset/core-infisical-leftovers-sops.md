---
"@stackra/mcp": minor
"@stackra/cli": minor
"@stackra/runway": minor
"@stackra/gen": minor
"@stackra/contracts": minor
---

The last Infisical uses in the developer packages move to sops and figentra/secrets (ADR 0525).

- `stackra mcp exec -- <argv>` decrypts each `$NAME` the command names with `sops exec-env` from the `agents` scope of
  the local figentra/secrets clone (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`), one nested call per secret,
  instead of `infisical run`. Its `--env` and `--path` flags are gone; `McpExecOptions` is now `{ secretsDir? }`.
- Mobile onboarding no longer writes the FCM key to a vault: it goes only to EAS, its one reader, and running the
  `push` step again replaces a lost key. `InfisicalVaultWriterDriver` is removed, and `MobileOnboardRequest` has no
  `vault` port. A missing root-kit name prints `pnpm secrets:put <NAME> --scope ci/production/store` as its owner step.
- gen's `env` manifest rows no longer carry `home` (the Infisical folder `/runtime/<member>`), and the field is gone
  from the `StackraManifest` type; runway already ignored it. Products regenerate their manifests after the release.
- `stackra dev --tunnel` names the sops way to start with `CLOUDFLARE_TUNNEL_TOKEN`, and the service template's
  `runway.yaml` header names figentra/secrets.
