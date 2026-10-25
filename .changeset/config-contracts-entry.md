---
"@stackra/config": minor
"@stackra/app": patch
"@stackra/platform": patch
"@stackra/gen": patch
"@stackra/integrations": patch
"@stackra/webhooks": patch
"@stackra/media": patch
---

Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
`@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
