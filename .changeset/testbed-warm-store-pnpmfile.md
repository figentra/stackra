---
"@stackra/infra-testbed": patch
---

The image's pnpm store is warmed with `.pnpmfile.mjs` beside the lockfile and `pnpm-workspace.yaml` (`pnpm fetch`
checks the pnpmfile's checksum, so the build failed without it). The validate phase now runs an offline `pnpm fetch`
against the store, so an incomplete store fails the build.
