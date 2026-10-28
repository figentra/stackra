---
"@stackra/contracts": minor
"@stackra/experience": minor
"@stackra/brand-kit": minor
---

One `LocalizedText`, in `@stackra/contracts` (a read-only record of strings per BCP 47 tag) (STA-1383). Breaking:
`@stackra/experience` and `@stackra/brand-kit/contracts` no longer export their copies; import `LocalizedText` from
`@stackra/contracts`. A brand kit's `name` and `line` are `LocalizedText & { readonly en: string }` (English still
required).
