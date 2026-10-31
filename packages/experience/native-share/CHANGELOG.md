# @stackra/native-share

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/media@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 806523e: Ship the share inbox's strings as `native_share::inbox.*` catalogues (en, ar, de, es, fr, it, nl, exported under
  `./assets/*`) and add `sharedItemPath`, the safe disk key a shared file is kept under, so a name another app sent never
  steps out of its folder.
- b1fb568: Add `@stackra/native-share`: receive photos, PDFs, links and text from other apps through expo-sharing's iOS share
  extension and Android share target, behind the `IncomingShare` port with memory and Expo drivers, `NativeShareConfig`,
  `useIncomingShare`, the `keepSharedItem` (FileSystem) and `uploadSharedItem` (media) helpers, and a config plugin.

### Patch Changes

- 4446ca7: `NativeShareOptions.maxItems`, `maxBytes` and `maxTextLength` carry `@Int` with the shipped schema's bounds, so gen
  reads them as whole numbers (STA-1542).
- 3d903fa: Ship `stackra.manifest.json` in the published package, so a host's gen can read the package's drivers, configs and identities.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [f22123c]
- Updated dependencies [6c05cfc]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [1785c8c]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/media@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
