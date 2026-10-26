---
"@stackra/runway": minor
---

Add the deploy path (ADR 0400): the `RunwayProvider` port with `deploy`, `promote` and `rollback` over `deployTargets`
(kinds in build order, regions in release order, then dedicated tenants), the `EncoreCloudProviderDriver` and
`EasProviderDriver` with `runCommand`, `RunwayDeployFailedError` and `DeployKind`; the root runway gains
`environments.<env>.cloud` (replacing `providers.gcp.environments`) and `environments.<env>.dedicated`, which
`checkRegions` checks, and `regionsOf` takes explicit region keys.
