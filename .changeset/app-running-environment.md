---
"@stackra/app": minor
---

A deployed service no longer boots as `dev` (STA-1571). `@stackra/app/server` adds `provideRuntimeEnvironment`, which
the generated Encore `environment.ts` calls with Encore's `appMeta().environment`, and `runningEnvironment`, which the
server `createApp` uses to set `STACKRA_ENVIRONMENT` for the configuration when it is unset: a local runtime (`encore
run`, `encore test`) is `dev` or `test`; a deployed one (Encore Cloud, which has no plain environment variables, or a
self-hosted image that declares its cloud) is its environment's name when that is `preview`, `staging` or
`production`, else `production`, `preview` or `staging` by its type. A deployed runtime set to `dev`, `test` or
nothing fails boot with `ConfigInvalidError`. So `@stackra/actions`' audit fails closed on every generated deployment.
With no runtime provided (a hand-built app in a test) nothing changes. `RuntimeEnvironment` is the type of the value.
