# @stackra/native-scale

## 0.1.0

### Minor Changes

- b5b73cb: `MtSicsScaleDriver` and `ContinuousAsciiScaleDriver` take `@stackra/platform`'s `SystemPermissions` as their second
  constructor parameter and ask it for `bluetooth` before a `ble` or `spp` link opens; denied or blocked resolves the
  `serial` refusal `permission_denied`, and a `usb` link asks nothing. The Android module no longer requires the
  location permission below Android 12: connecting to a known address needs only the install-time Bluetooth permissions
  (STA-1531).
- 930d5c6: New package (ADR 0478, STA-1531): the `StackraNativeScale` Expo module behind `@stackra/peripherals`' unchanged `Scale`
  port, with `MtSicsScaleDriver` (Mettler Toledo MT-SICS) and `ContinuousAsciiScaleDriver` (the A&D standard format
  stream) over Bluetooth LE, Bluetooth SPP and USB serial, `frame()` for the full legal-for-trade reading (unit, stable,
  net or gross, tare), `NativeScaleConfig` with the `SCALE_PROTOCOLS` pack, the Swift and Kotlin byte links, and the
  config plugin that keeps only the transports an app lists.

### Patch Changes

- 1b4effa: `@stackra/platform`'s permission port is named `SystemPermissions` (key `platform.SystemPermissions`), beside
  `SystemAccessibility` and `SystemSettings`, so it no longer shares a name with `@stackra/devices`' `DevicePermissions`.
  Its drivers are `MemorySystemPermissionsDriver` and `ExpoSystemPermissionsDriver`; the card terminal and scale drivers
  take it as their permission parameter, and gen's host wiring defaults its `SystemPermissions` table.
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
- Updated dependencies [03496b5]
- Updated dependencies [830ea4a]
- Updated dependencies [dfa989f]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
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
  - @stackra/peripherals@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
