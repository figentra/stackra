---
"@stackra/settings": minor
---

Add `SettingsApprovalSourceDriver`, the `ApprovalSettingsSource` driver (STA-1724, ADR 0509): it reads the effective value of an
`approval`-marked setting key through `SettingsResolver` for the running scope, and refuses an unknown key or one not marked
`approval`. Settings does not depend on `@stackra/actions`.
