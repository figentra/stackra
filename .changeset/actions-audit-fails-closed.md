---
"@stackra/actions": minor
---

An action no longer runs unaudited in a deployment (STA-1571, ADR 0212 decisions 1 and 4). Outside `dev` and `test`, an
action with no `AuditTrail` bound now throws `AuditTrail is not bound in <environment>: ...` before any step runs,
the same way a missing `AccessControl` does; before, every write and refusal went unaudited without a word. The
environment is the new `AuditConfig` (key `actions.audit`, exported with `AuditConfig$` and `AuditOptions`), read from
`STACKRA_ENVIRONMENT`: refused at boot when it is empty, and any name but `dev` or `test` (`preview`, `staging`,
`production`, a typo) needs a trail. Unset means `dev`, and the trail is then optional: a process that runs with
neither the variable nor a generated Encore entry (a hand-written server, a script) is not protected. A generated
Encore service is: `@stackra/app` derives the variable from where Encore runs it, so a deployed one is never `dev`.
Queries are unchanged, and a container that binds no `AuditConfig` (a hand-built test resolver) keeps the old
behaviour. To upgrade a deployed service, bind an `AuditTrail` driver (`outbox` from `@stackra/actions`, or
`@stackra/access-log`'s `postgres`), upgrade `@stackra/app` and `@stackra/gen` and regenerate (`stackra gen`); set
`STACKRA_ENVIRONMENT` yourself only outside Encore, and on a self-hosted image declare its cloud in the infra config.
