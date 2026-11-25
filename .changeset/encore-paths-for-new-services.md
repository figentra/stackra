---
"@stackra/cli": patch
---

`stackra create` and `stackra new service` give each service a tsconfig.json whose `compilerOptions.paths` mirror its
package.json `imports`, so `stackra dev` can start Encore: Encore 1.58 ignores `imports` (it reads `#modules/x` as a
package and fails with "failed to get the node_modules path") and reads `paths` only from the service's own tsconfig,
never through `extends` (STA-2794).
