---
"@stackra/app": minor
"@stackra/cli": minor
"@stackra/infra-testbed": patch
---

Dev sign-in (STA-2795): a service run by `stackra dev` now accepts dev tokens, so a new app's protected routes can be
called locally with no identity provider. `stackra dev token` prints one for the workspace's seeded dev user (or
`--user`, `--realm`, `--scope` with `--scope-id`, `--role`, `--permission`, `--ttl`); the first `stackra dev` of a
service makes the ES256 key pair and the user in `.stackra/dev-issuer.json` (git-ignored, mode 600) and hands the
service only the public key in `STACKRA_DEV_ISSUER_KEYS` with `STACKRA_ENVIRONMENT=dev`.

`@stackra/app`: `BearerConfig` reads `devKeys` (`STACKRA_DEV_ISSUER_KEYS`) and no environment: whether dev tokens
pass is the answer of the one environment reader (`readEnvironment`, STA-2844), never a configuration value, so a
values layer or a host override cannot turn dev sign-in on. `CallAuthenticator` and `BearerTokenGuard` verify through
the new `verifyCallToken(token, config, keys, environment)`, which accepts a token from `DEV_ISSUER` under the dev keys
with every check a real token gets, and pass it the reader's answer on every call. `devIssuerKeys(config,
environment)` refuses dev keys in any running environment but `dev` with `ConfigInvalidError`, and `createApp` calls it
with the environment it boots as, before the generated boot, so a deployed service that carries the key never
starts. New exports: `DEV_ISSUER`, `createDevIssuerKey`, `mintDevToken`
(`@stackra/app`) and `devIssuerKeys`, `verifyCallToken` (`@stackra/app/server`). ADR 0206, amendment of 2026-11-26.

`@stackra/infra-testbed`: the box sync leaves out `.stackra/dev-issuer.json`, as it does the dev secrets.
