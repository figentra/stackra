---
"@stackra/gen": minor
---

The manifest lists `surfaces`: each surface a shell dependency's slots sit on, with the shell line the member targets
there (`targets: "console@3"`, from the shell's major) and the shell package (`surfacesOf`). Two shells on one surface
at different majors are refused on the full pass (`surface_targets_conflict`, `checkSurfaces`). New
`ExtensionBundleManifest` type and the pure `modulepreloadOf(shellEntry, bundleBase, bundle)` for the edge Worker's
modulepreload links (ADR 0436, stackra-04).
