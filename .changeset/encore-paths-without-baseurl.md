---
"@stackra/repo-checks": patch
"@stackra/cli": patch
"@stackra/gen": patch
---

A service's tsconfig no longer needs `baseUrl` for Encore. TypeScript 7 removed `baseUrl` (TS5102), so the rule from 0.30.0 broke typecheck in a TS 7 repository (INVOICING).

- **The service check:** it now requires only `compilerOptions.paths` equal to package.json `imports`, which resolve from the tsconfig's folder. It refuses a `baseUrl`.
- **`stackra encore:prepare`:**
  - it removes an existing `baseUrl`;
  - it writes package.json and tsconfig.json with gen's `formatJson`, now exported from `@stackra/gen`, in the repository formatter's layout, so the format check passes after it.

Bump step: run `stackra encore:prepare` in each service, or delete `"baseUrl": "."` from its tsconfig.
