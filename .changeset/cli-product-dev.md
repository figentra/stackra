---
"@stackra/cli": minor
---

`stackra dev` runs a product with no app members locally. `--surface <s> --os <checkout>` starts the local shell's own
Vite, which serves the product packages' `./<surface>` entries from source with hot reload (and a landing site's seed
document from `content`), so gen's bundle mode is no longer needed for a local shell. `--mobile <app> --os <checkout>
--device <udid>` prepares the app from its template line with Runway's `prepareMobileDev`, prebuilds it and runs a
Release build on the iOS simulator. `--product --os <checkout>` runs every surface and mobile app of the root runway.
