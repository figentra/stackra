---
"@stackra/gen": patch
---

`readAppDefinition` refuses a `defineApp` argument that is not static data (a spread, a call) as
`app_definition_not_static` again, instead of reading the parse error as the definition (STA-768).
