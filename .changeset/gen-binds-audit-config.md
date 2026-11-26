---
"@stackra/gen": patch
---

A service that runs an action (its own or a hosted package's) now gets the `actions.audit` config row (`AuditConfig` of
`@stackra/actions`) in its generated wiring, so the pipeline knows the running environment from `STACKRA_ENVIRONMENT`
and refuses an unaudited action outside `dev` and `test` (STA-1571). The row is added only when the declared
`@stackra/actions` manifest lists `AuditConfig`, so an older version adds nothing. Regenerate (`stackra gen`).
