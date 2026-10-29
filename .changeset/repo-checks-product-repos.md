---
"@stackra/repo-checks": patch
---

In a product repository, validate no longer applies the Stackra repository's own member rules: the package names by
placement, the MIT licence, `sideEffects: false`, the stackra `repository` and `publishConfig`, and the brand NOTICE.
A v3 service needs `stackra.config.ts` but no root module file, which v3.1 R12 writes only when it says something.
