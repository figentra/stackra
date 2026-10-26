---
"@stackra/validation": minor
"@stackra/calendar": minor
"@stackra/content": minor
"@stackra/data-transfer": minor
"@stackra/settings": minor
"@stackra/iam": minor
---

Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
`Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
`WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
`ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
`@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
`@stackra/rules`.
