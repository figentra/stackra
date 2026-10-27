---
"@stackra/contracts": minor
"@stackra/rules": minor
"@stackra/shipping": minor
"@stackra/i18n": minor
---

`GeoPoint` has one home, `@stackra/contracts`. Breaking: `@stackra/rules/contracts`, `@stackra/shipping/contracts` and
`@stackra/i18n/contracts` no longer export their identical copies; import `GeoPoint` from `@stackra/contracts` (STA-1383).
