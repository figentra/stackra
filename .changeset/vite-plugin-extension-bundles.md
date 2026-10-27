---
"@stackra/vite-plugin": minor
---

Add `stackra.bundleConfig(options)`, the extension-bundle build of a product UI package for one surface: every
specifier the shell's import map resolves stays external, the bundle is written as hashed ES modules under
`dist/bundles/<surface>/<version>/` with `bundle.manifest.json` (targets from gen's `surfaces`, entry, modulepreload
list, stylesheets, the shared imports used). A bundled copy of a mapped package or any HeroUI Pro code fails the build;
`proTypesOnly` (off until owner point 16.8) leaves Pro external for product CI without the licence. New types
`BundleConfigOptions` and `ImportMap` (ADR 0436, stackra-04).
