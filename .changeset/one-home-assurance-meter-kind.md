---
"@stackra/contracts": minor
"@stackra/actions": minor
"@stackra/identity": minor
"@stackra/model": minor
"@stackra/ai": patch
"@stackra/integrations": patch
---

`AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
`MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
