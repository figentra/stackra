---
"@stackra/config": minor
"@stackra/app": minor
"@stackra/gen": minor
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

One reader decides the environment a process runs as, and only the runtime sets it (STA-2844, ADR 0296 as amended on
2026-11-26). `@stackra/config` adds `readEnvironment(raw, platform?)`, the closed list `StackraEnvironment` (`dev`,
`test`, `preview`, `staging`, `production`), `isDeployedEnvironment`, `PlatformEnvironment`, `ENVIRONMENT_VARIABLE` and
`SAFETY_CRITICAL_VARIABLES`. A configuration field mapped to `STACKRA_ENVIRONMENT` is now runtime-only: a runway
`config` value or a test's `values` for it fails boot with `ConfigInvalidError`, and a `STACKRA_ENVIRONMENT` outside the
list (`prod`, a typo) fails boot instead of reading as some environment. `@stackra/app/server` adds
`providePlatformEnvironment`, and the server `createApp` builds the configuration with the reader's answer: a deployed
Encore service with no variable runs as its deployed environment instead of `dev`, `dev` or `test` declared on a
deployment fails boot, and so does a self-hosted image that reports no environment. `@stackra/gen` writes
`stackra-encore/<member>/environment.ts` for every service that runs `@stackra/app`, imported first by each generated
Encore file. `runway validate` and `stackra validate --repository` refuse a runway `config` block that sets such a field
(`checkRuntimeOnlyConfig`, `runtimeOnlyFields`, `runtimeOnlyFieldsOf`).

Upgrading: remove any `environment` value from a runway `config` block or a test's `values` for a configuration mapped to
`STACKRA_ENVIRONMENT` (`outbox.relay_inbox`, `market_packs`), and set the variable on the runtime instead, or leave it
unset on Encore Cloud. Regenerate with `stackra gen` so each service gets its `environment.ts`.
