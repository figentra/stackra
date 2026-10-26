---
"@stackra/settings": minor
---

Add entitlement-gated settings: `@Setting({ entitlement, entitlementValues })`, the `SettingEntitlementSource` port
with a memory driver, reads that fall back to the default with provenance `entitlement`, and writes refused
`entitlement_required` (ADR 0420). Add `settingSystemAuthor(name)` for seed writes, `MarketPackSettingFloorSourceDriver`,
and a `market` option on `settingsApply` so a floor-bearing group can be applied (ADR 0419).
