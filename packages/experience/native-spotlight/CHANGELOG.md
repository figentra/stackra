# @stackra/native-spotlight

## 0.1.0

### Minor Changes

- baf6e44: Add `@stackra/native-spotlight` (STA-1540, ADR 0478): the signed-in person's own recent records in the phone's own
  search, iOS Core Spotlight and Android launcher search, with deep links back into the app. The `DeviceSearchIndex`
  port, the `SpotlightConfig` visibility rules (own records, listed kinds, never sensitive, newest and recent only),
  `SpotlightIndexer` (`sync`, `remove`, `clearOnSignOut`, which clears on sign-out and on a revoked session), the memory
  driver, `ExpoDeviceSearchIndexDriver` over the `StackraSpotlight` Expo module, and its config plugin.

### Patch Changes

- 3d903fa: Ship `stackra.manifest.json` in the published package, so a host's gen can read the package's drivers, configs and identities.
- c7302cd: `indexableItems` sorts with `sort` on its own filtered copy instead of the ES2023 `toSorted`, and
  `SpotlightNativeModule` declares its `addListener` itself, as expo's `NativeModule` type is the module class rather than
  an instance; the package typechecks against its ES2022 preset again.
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
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [de4d77d]
- Updated dependencies [cc96d5d]
- Updated dependencies [d63f012]
- Updated dependencies [072dc7e]
- Updated dependencies [b58ebce]
- Updated dependencies [1723c05]
- Updated dependencies [d15a219]
- Updated dependencies [8ce76e9]
- Updated dependencies [c46f32f]
- Updated dependencies [2c2beca]
- Updated dependencies [9e63234]
- Updated dependencies [04a0f8c]
- Updated dependencies [544b42d]
- Updated dependencies [2787c1e]
- Updated dependencies [90957bd]
- Updated dependencies [1b4effa]
- Updated dependencies [6855121]
- Updated dependencies [d7ed271]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/platform@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
