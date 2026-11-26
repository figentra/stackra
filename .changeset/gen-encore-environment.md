---
"@stackra/gen": patch
---

A service with a server entry now gets `stackra-encore/<member>/environment.ts`, which hands Encore's
`appMeta().environment` to `provideRuntimeEnvironment` of `@stackra/app/server`, and every generated Encore file
imports it first, ahead of `./database` and the server app (STA-1571). The server app then derives
`STACKRA_ENVIRONMENT` where the deployment cannot set it, so a deployed service never runs as `dev` and an action
there with no `AuditTrail` fails closed. Regenerate (`stackra gen`) with `@stackra/app` at the matching version.
