---
"@stackra/platform": minor
---

Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9): `Bridge`, `PickFolderBridge` and
`ElectronPlatformDriver` keep their names, so only the import path changes (`@stackra/platform/desktop`). Add
`ExpoPlatformDriver` to `./native`, the `Platform` driver of the Expo target: online state from NetInfo, local
notifications and the badge from expo-notifications, the share sheet from React Native, haptics from expo-haptics and
the barcode scanner from expo-camera; `has` answers false for file handling, share target and install. NetInfo,
expo-camera and expo-haptics are new optional peers.
