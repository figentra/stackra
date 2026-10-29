# @stackra/native-customer-display

## 0.1.0

### Minor Changes

- 830ea4a: New `@stackra/native-customer-display` (ADR 0478): the `StackraCustomerDisplay` Expo module (an Android `Presentation`
  and an iPad external-display scene, moved unchanged from the mobile app's `src/native-sources/customer-display/`) with
  `ExternalCustomerDisplayDriver` behind the unchanged `CustomerDisplay` port, and its config plugin. `@stackra/peripherals`:
  `ExternalCustomerDisplayDriver` leaves the `.` entry for the new package (same driver name `external`); import it from
  `@stackra/native-customer-display`. `@stackra/repo-checks`: `checkNativeModules` no longer exempts the mobile app's
  customer display (STA-1533).

### Patch Changes

- Updated dependencies [ae3d280]
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
- Updated dependencies [65f5ac1]
- Updated dependencies [03496b5]
- Updated dependencies [830ea4a]
- Updated dependencies [dfa989f]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [b58ebce]
- Updated dependencies [e49d5c7]
- Updated dependencies [2c2beca]
- Updated dependencies [5c266dc]
- Updated dependencies [c402bab]
- Updated dependencies [2787c1e]
- Updated dependencies [c968ffd]
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
- Updated dependencies [cfaa96b]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/platform@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/peripherals@0.1.0

Written by Changesets on release; never edited by hand.
