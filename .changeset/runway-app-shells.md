---
"@stackra/runway": minor
---

The root runway gains `surfaces`, `mobile` and `assets` (ADR 0436 to 0441) and a lanes repository index
(`lanes.repoIndex`, `lanes.worktrees`). New checks: `checkSurfaces` (ops takes only `contributes`, landing alone takes
`content`, paths stay under the assets root, hosts are unique, app ids end in `.<product>.<app>`) and `checkDevPorts`
(no two effective dev ports collide on any lane of any indexed repository, STA-863). New Runway steps over ports:
`publishExtensionBundles` (`ExtensionBundlePublisher`), `edgeRowsOf` and `registerPlatformHosts` (`EdgeStore`), and
`mobileBuildRequests` and `buildMobileApps` (`MobileBuilder`), with `EasMobileBuilderDriver` in `./node` and the
not-yet-wired `CloudflareKvEdgeStoreDriver` and `RegistryBundlePublisherDriver`, which reject with
`RunwayNotConfiguredError`.
