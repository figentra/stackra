---
"@stackra/actions": minor
---

An action no longer runs unaudited in a deployment (STA-1571, ADR 0212 decisions 1 and 4). In a deployed environment
(`preview`, `staging`, `production`), an action with no `AuditTrail` bound now throws
`AuditTrail is not bound in <environment>: ...` before any step runs, the same way a missing `AccessControl` does;
before, every write and refusal went unaudited without a word. The environment comes from the one reader of
`@stackra/config` (STA-2844): the new `AuditConfig` (key `actions.audit`, exported with `AuditConfig$` and
`AuditOptions`) holds it as one of `StackraEnvironment`, read from `STACKRA_ENVIRONMENT` in the runtime only, so a
misspelt name (`prod`) fails boot and a runway `config` value for it is refused. It has no default of its own: unset,
and in a container that binds no `AuditConfig`, the pipeline asks `readEnvironment` over the process environment, so a
deployment is never exempt because a field was unset or a wiring was not regenerated. Queries are unchanged. To upgrade
a deployed service, bind an `AuditTrail` driver (`outbox` from `@stackra/actions`, or `@stackra/access-log`'s
`postgres`), upgrade every `@stackra/*` package together and regenerate (`stackra gen`). A test that runs actions with
`STACKRA_ENVIRONMENT` set to a deployed name needs a trail bound.
