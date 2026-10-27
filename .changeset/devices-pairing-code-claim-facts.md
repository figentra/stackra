---
"@stackra/devices": minor
---

Export `PAIRING_CODE_ALPHABET` and `newPairingCode` from `.` so other registry drivers draw the same codes.
`DeviceRegistry.claim` takes optional `DeviceClaimFacts` (`scopeId`, `market`, `pairedBy`), which `RegisteredDevice`
carries and the memory driver stores. `DeviceKind` gains `counted` (the device limit) and `fiscalUnit`; the catalogue
reader defaults them to `true` and `false`.
