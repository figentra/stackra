---
"@stackra/tenancy": patch
---

`runAsTenant(T, work)` now refuses a new `BelongsToTenant` row that `work` saves with a `tenantId` other than `T`.
Before, a model factory whose `definition()` set `tenantId` silently replaced the tenant `runAsTenant` gives, so a
test arranged its rows in a random tenant and failed far from the cause. The flush now throws, for example
`Member was created in runAsTenant(scp_A) with tenantId scp_X: does its factory definition() set tenantId? Leave it
to runAsTenant.` It catches every way of setting it: the factory definition, `create({ tenantId })` and a direct
insert through the entity manager. A `tenantId` equal to `T` is fine; a test that needs another tenant's row creates
it in `runAsTenant(B, …)`. Outside `runAsTenant`, and in production, nothing changes: the check lives in `./testing`.

Fix these factories before taking this version, or their tests fail: OS scheduling-calendar `booking.factory.ts` and
`resource-record.factory.ts`, and OS tenancy `membership.factory.ts`.
