---
"@stackra/entitlements": minor
---

Add `@stackra/entitlements`: the `Entitlement({ kind, counts })` kind for feature, limit and module rights, the
`EntitlementSource` and `EntitlementUsage` ports, `PlanEntitlementCheckDriver` for the action pipeline's entitlement
step (grants and counts in the call's `scope`) with `registerEntitlements` and `entitlementKey`, the `LimitReachedError` refusal (`limit_reached`) and
`fakeEntitlements` (`./testing`).
