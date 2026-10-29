---
"@stackra/runway": minor
"@stackra/cli": minor
---

A product with no app members builds and deploys from its CI: `stackra build --product [--dry-run]` builds every
surface's extension bundle against its shell line's import map and every mobile app's EAS build, and writes
`dist/product/build.json`; `stackra deploy --product --env <environment>` publishes the bundles and host rows, lists
the landing seeds, submits the mobile builds, and waits on the environment's approval (`--approved`). Runway adds
`buildProduct`, `deployProduct`, `workspacePackages` and `exportSourceOf`; the mobile job takes `buildOnly` and `packages`.
