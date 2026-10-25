---
"@stackra/entitlements": minor
---

Add the `./contracts` entry: `EntitlementUsage` moves there from `.` (import it from `@stackra/entitlements/contracts`).
`EntitlementSource` stays in `.`, because its signature names the core `Entitlement` base.
