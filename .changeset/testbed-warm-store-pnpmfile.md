---
"@stackra/infra-testbed": patch
---

The image's pnpm store is warmed with `.pnpmfile.mjs` and `.npmrc` beside the lockfile and `pnpm-workspace.yaml`
(`pnpm fetch` checks the pnpmfile's checksum and resolves the `@figentra-oss` scope from `.npmrc`; the build failed
without them). The validate phase now runs an offline `pnpm fetch`
against the store, so an incomplete store fails the build.
