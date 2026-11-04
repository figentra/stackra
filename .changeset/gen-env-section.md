---
"@stackra/gen": minor
"@stackra/config": minor
"@stackra/contracts": minor
---

`stackra gen` writes an `env` section into `stackra.manifest.json` (ADR 0173 amendment 2026-11-04, STA-2104): one
row per environment name the member's configuration classes declare (`Config({ env })` names and `@Secret` fields),
with its kind (`secret`, `public`, `config`), type, rules, refused prefixes and environments; a service, app or
worker adds its hosted packages' rows and the Infisical path `/runtime/<member>`. `@Secret` takes an optional second
argument, `{ refuse, environments }`, read by gen. `StackraManifest` types the section.
