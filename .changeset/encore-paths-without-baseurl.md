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

`stackra encore:prepare` also keeps a tsconfig's file contract written inside the braces (NOTIFY's services). Before, it kept only the `//` lines above the object, so the contract was dropped and the format check failed. `encore.dev` stays the literal catalog version (ADR 0091 rule 3): Encore rewrites `catalog:` to `^<version>`, which breaks the frozen install.
