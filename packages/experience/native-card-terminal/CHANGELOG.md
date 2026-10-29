# @stackra/native-card-terminal

## 0.1.0

### Minor Changes

- 284e596: `StripeTerminalCardTerminalDriver` and `NativeStripeTerminalBridgeDriver` take `@stackra/platform`'s
  `SystemPermissions` as their second constructor parameter and ask through it instead of the module: `pair` asks
  Bluetooth, then location, before discovery and refuses `permission_denied` on `bluetooth` when either is denied or
  blocked; `connectTapToPay` asks location and answers `location_permission_denied`. The module's own
  `requestPermissions` (and the iOS `LocationPermission` helper) is removed (STA-1532).
- 73a1385: Add `@stackra/native-card-terminal`: the `StackraCardTerminal` Expo module over Stripe Terminal's iOS and Android SDKs,
  the `stripe_terminal` `CardTerminal` driver for Bluetooth readers, the `native` `StripeTerminalBridge` driver for Tap to
  Pay, the `StripeTerminalServer` port through which connection tokens and the Stripe location come from the server, and
  the config plugin that adds the Bluetooth, location and NFC permissions and the Tap to Pay entitlement (ADR 0478,
  ADR 0479).

### Patch Changes

- 1b4effa: `@stackra/platform`'s permission port is named `SystemPermissions` (key `platform.SystemPermissions`), beside
  `SystemAccessibility` and `SystemSettings`, so it no longer shares a name with `@stackra/devices`' `DevicePermissions`.
  Its drivers are `MemorySystemPermissionsDriver` and `ExpoSystemPermissionsDriver`; the card terminal and scale drivers
  take it as their permission parameter, and gen's host wiring defaults its `SystemPermissions` table.
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
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [4829f13]
- Updated dependencies [30a33ab]
- Updated dependencies [e49d5c7]
- Updated dependencies [d52cd20]
- Updated dependencies [4c2a776]
- Updated dependencies [d18a6bf]
- Updated dependencies [f95818c]
- Updated dependencies [b523b59]
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
- Updated dependencies [fc51f13]
- Updated dependencies [d19a3d5]
  - @stackra/platform@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/peripherals@0.1.0
  - @stackra/payments@0.1.0

Written by Changesets on release; never edited by hand.
