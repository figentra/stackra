---
"@stackra/entitlements": minor
"@stackra/clients": minor
---

Products can read real plans. `@stackra/entitlements` adds `ServicePlanSnapshotsDriver`, a `PlanSnapshots` that asks
the plan service through the new `PlanServiceChannel` port and caches each answer for its `maxAgeSeconds`. It fails
closed: a failed call, an answer for another scope or an undecodable grant reads as no plan and is not cached.
`@stackra/clients` adds `TransportPlanServiceChannelDriver`, the channel over the host's `ClientTransport` calling
`entitlements.effective_set.snapshot.get@1`. A product binds both in place of `MemoryPlanSnapshotsDriver`, so
`@Requires`, the entitlement check and reserve-then-commit answer from the tenant's actual plan.
