---
"@stackra/starter": minor
"@stackra/cli": patch
"@stackra/runway": minor
---

`@stackra/starter` is published with every release, in the fixed group, so `stackra create` finds a starter of its own
version instead of a 404 (STA-2874). It packs the stackra-template at the commit `stackra.template.commit` pins as
`dist/template.tgz`, so the template's `.npmrc` and `.gitignore` files reach the new app. `stackra create` reads that
nested archive (`starterTarball`); a starter packed with the template's own script still reads as before.

The root runway takes `release.npm.promoteLatestAfter`: `consumer-smoke` (the default) moves `latest` only after a
clean consumer made an app with `stackra create` from the registry; `immediate` moves it once the dependency closure
holds.
