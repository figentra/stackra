---
"@stackra/contracts": minor
"@stackra/pricing": minor
"@stackra/entitlements": minor
"@stackra/panel": patch
---

`CatalogueRow` has one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/pricing` and `@stackra/entitlements`
no longer export their identical copies; import `CatalogueRow` from `@stackra/contracts`.
