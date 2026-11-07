---
"@stackra/contracts": patch
"@stackra/actions": patch
"@stackra/queue": patch
"@stackra/iam": patch
"@stackra/workflow": patch
"@stackra/access-log": patch
"@stackra/tenancy": patch
---

`actingScopeId(actor)` and `claimedScopeIds(actor)` move to `@stackra/contracts`: the one answer to which tenant a call acts
in (an agent's own `scopeId`, else the tenant of the human it acts for; any other actor's own `scopeId`). Every place
that read `actor.scopeId` as the call's tenant now reads it: the pipeline's `CallDescriptor.scopeId` and `ctx.scopeId`
(so rate limits, meters, idempotency, query cache keys, approvals and audit entries follow), the queue's job actor and
unique key, IAM's node lookup, the automation principal check, the access-log outbox sink's `scopeId` stamp, and
`PostgresAuditTrailDriver`, which now records an agent with no tenant of its own in its human's tenant instead of
skipping it. A platform agent and every other actor kind are unchanged.
