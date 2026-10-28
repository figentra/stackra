---
"@stackra/platform": minor
---

Add `DevicePermissions` (STA-1536), the one permission helper for camera, location, photos, Bluetooth and microphone:
it reads and asks, answers `granted`, `denied` or `blocked`, and opens the OS settings when blocked. Ships the memory
driver, the abstract `ExpoDevicePermissionsDriver` and the `platform::permissions.*` explanations in seven locales.
