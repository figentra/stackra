---
"@stackra/actions": minor
---

An action no longer runs unaudited in a deployment (STA-1571, ADR 0212 decisions 1 and 4). Outside `dev` and `test`, an
action with no `AuditTrail` bound now throws `AuditTrail is not bound in <environment>: ...` before any step runs,
the same way a missing `AccessControl` does; before, every write and refusal went unaudited without a word. The
environment is the new `AuditConfig` (key `actions.audit`, exported with `AuditConfig$` and `AuditOptions`), read from
`STACKRA_ENVIRONMENT`: `dev` when it is unset, refused at boot when it is empty, and any other name (`preview`,
`staging`, `production`, a typo) needs a trail. Queries are unchanged, and a container that binds no `AuditConfig` (a
hand-built test resolver) keeps the old behaviour. To upgrade a deployed service, bind an `AuditTrail` driver (`outbox`
from `@stackra/actions`, or `@stackra/access-log`'s `postgres`) and set `STACKRA_ENVIRONMENT`.
