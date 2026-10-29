---
"@stackra/native-card-terminal": minor
---

`StripeTerminalCardTerminalDriver` and `NativeStripeTerminalBridgeDriver` take `@stackra/platform`'s
`SystemPermissions` as their second constructor parameter and ask through it instead of the module: `pair` asks
Bluetooth, then location, before discovery and refuses `permission_denied` on `bluetooth` when either is denied or
blocked; `connectTapToPay` asks location and answers `location_permission_denied`. The module's own
`requestPermissions` (and the iOS `LocationPermission` helper) is removed (STA-1532).
