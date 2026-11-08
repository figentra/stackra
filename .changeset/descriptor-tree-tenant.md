---
"@stackra/actions": minor
"@stackra/tenancy": patch
"@stackra/access-log": minor
---

A branch user can now complete an action that needs approval. The isolation already ran a branch user's call as the
tenant above the branch, but the pipeline still labelled what the call wrote with the branch id, so the approval
binding was refused by the tenant's row policy and the request could not be parked.

`CallIsolation.run` now hands its work the actor it runs as, with the tenant from the scope tree. The pipeline takes
that tenant as the call's `scopeId`, on the descriptor and on `ctx`, before any step inside the isolation runs. So the
approval binding and request, usage and analytics events, published events, audit entries and the query cache key
all carry the tenant. The branch the user acts from stays on the new `CallDescriptor.branchScopeId`, and the actor is
unchanged. With no isolation bound, nothing changes: `scopeId` and `branchScopeId` are both the actor's own claim.

Rate limits and idempotency keys are now per tenant for a branch user: all branches of one tenant share the tenant's
buckets and keys, as tenant-level users already did.

The access log and the Postgres audit trail now store a branch user's records in the tenant's chain, not under the
branch id. `AccessRecord` has an optional `scopeId`, which `AccessLogExplorer` fills from the call's context, and
`AccessLogService.record` takes it as an optional last argument.
