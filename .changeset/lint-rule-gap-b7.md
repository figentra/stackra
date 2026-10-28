---
"@stackra/oxlint-config": minor
"@stackra/actions": patch
"@stackra/loyalty-kit": patch
"@stackra/money": patch
"@stackra/icons": patch
"@stackra/tokens": patch
"@stackra/ui": patch
"@stackra/validation": patch
"@stackra/infra-cloudflare": patch
"@stackra/infra-github": patch
"@stackra/infra-observability": patch
"@stackra/tsdown-config": patch
---

Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
build scripts, tests, stories and e2e specs are off.

The other packages: no behaviour change. Exported functions and public class members now spell the return type they
already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
schema type with a reasoned disable.
