---
"@stackra/notifications": patch
"@stackra/webhooks": patch
"@stackra/rules": patch
"@stackra/data-transfer": patch
"@stackra/identity": minor
"@stackra/documents": patch
"@stackra/experience": patch
"@stackra/seo": patch
"@stackra/brand-kit": patch
"@stackra/market-packs": patch
"@stackra/gen": patch
"@stackra/panel": patch
"@stackra/calendar": patch
"@stackra/licensing": patch
---

Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
(`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
`ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
behaviour). New dependency for each except licensing: `@stackra/support`.
