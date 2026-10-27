---
"@stackra/gen": minor
"@stackra/integrations": minor
"@stackra/scope": minor
"@stackra/realtime": minor
"@stackra/errors": minor
"@stackra/config": minor
"@stackra/feature-flags": minor
---

Packages ship their `stackra.manifest.json` (listed in `files`), and the manifest gains a `config` section that gen
reads for package config rows instead of the `*Config` name suffix. `stackra gen --check` refuses an unshipped manifest
(`manifest_unshipped`). New memory drivers: `ConnectionStore` (integrations), `ScopeResolver` (scope),
`RealtimeFanout` (realtime), `ErrorReporter` (errors), `SecretStore` (config) and `FlagProvider` (feature-flags).
Generated file headers keep ` *` on continuation lines, so every generated header changes on the next regeneration.
