---
"@stackra/ui": minor
"@stackra/platform": minor
"@stackra/peripherals": minor
"@stackra/devices": minor
---

Kiosks, lanes and gates (STA-801, ADR 0428 to 0430): `KioskSurface` and `useKiosk` (web and native) with idle reset,
reach layout, high contrast and audio announcements; `KioskConfig` (`platform.kiosk`) and `enterKioskOnLaunch`;
`Scale.onWeight` weight streams; the `AccessController` port with its `memory` driver, Ed25519 receipt tokens
(`signReceiptToken`, `verifyReceiptToken`, `importReceiptPublicKey`) and `ExitGateService`; the `external` customer
display driver over the native `StackraCustomerDisplay` module; `BASE_DEVICE_CATALOGUE` and `deviceCatalogueOf`.
`Scale` gains an abstract `onWeight`: a custom `Scale` driver must implement it.
