---
"@stackra/native-scale": minor
---

`MtSicsScaleDriver` and `ContinuousAsciiScaleDriver` take `@stackra/platform`'s `DevicePermissions` as their second
constructor parameter and ask it for `bluetooth` before a `ble` or `spp` link opens; denied or blocked resolves the
`serial` refusal `permission_denied`, and a `usb` link asks nothing. The Android module no longer requires the
location permission below Android 12: connecting to a known address needs only the install-time Bluetooth permissions
(STA-1531).
