---
"@stackra/platform": patch
"@stackra/native-card-terminal": patch
"@stackra/native-scale": patch
"@stackra/gen": patch
---

`@stackra/platform`'s permission port is named `SystemPermissions` (key `platform.SystemPermissions`), beside
`SystemAccessibility` and `SystemSettings`, so it no longer shares a name with `@stackra/devices`' `DevicePermissions`.
Its drivers are `MemorySystemPermissionsDriver` and `ExpoSystemPermissionsDriver`; the card terminal and scale drivers
take it as their permission parameter, and gen's host wiring defaults its `SystemPermissions` table.
