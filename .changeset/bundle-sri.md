---
"@stackra/vite-plugin": minor
"@stackra/gen": minor
"@stackra/runway": minor
---

Subresource Integrity for extension bundles. The bundle build records a sha384 for every emitted file in
`bundle.manifest.json` (`integrity`). Runway refuses to publish a bundle whose file is missing or changed since the
build, carries each value by URL on the edge release, and the shell page pins every bundle URL with it: an
`integrity` attribute on each modulepreload and stylesheet link, and the import map's `integrity` block for the
chunks no link names. A bundle built before this has no `integrity` and renders as before.
