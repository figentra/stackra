---
"@stackra/brand-kit": minor
---

Add the generic brand generator (stackra-12): `runBrandKit` and the `stackra-brand-kit` binary read
`assets/brand/kit.json` (with an optional parent kit as data) and write tokens and HeroUI CSS through `@stackra/tokens`,
app and adaptive icons, splash screens, favicons (`favicon.ico` without an image library), the web manifest and store
frames with captions from `assets/store`, rendered by resvg with the kit's fonts, plus `asset-manifest.json`.
`--check` writes nothing: the kit file checklist (README, versions, logos, the parent's endorsement mark, no live
`<text>` in a logo, the sources each output needs), a determinism rebuild and drift against the output folder.
`KitInput.theme` is now always the resolved theme and `KitInput` gains `files`.
