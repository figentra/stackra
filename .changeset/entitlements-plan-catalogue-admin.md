---
"@stackra/entitlements": minor
---

Add the plan-catalogue admin mechanism (ADR 0391): dated `CatalogueVersion`s behind the `CatalogueVersions` port with a
memory driver, `PlanCatalogueService` (seed from a product seed pack, propose, approve with a second approver for
discounts, reject, the version in force at a term's start so changes reach subscribers at renewal), `versionInForce`,
the plan catalogue types with `planCatalogueOf`, and `tierPlan` to turn a tier and add-ons into a plan snapshot.
