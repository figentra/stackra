---
"@stackra/entitlements": minor
---

Export `isLimitGrant` and `limitOf` from `.`. `planCatalogueOf` keeps rows of unknown record kinds in
`PlanCatalogue.extras` instead of refusing them. Add the `CapLiftFacts` contract type, the optional
`PlanSnapshot.paidSince` and `paidPlanDays` for the cap lift.
