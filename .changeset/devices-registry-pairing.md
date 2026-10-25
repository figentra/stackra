---
"@stackra/devices": minor
---

Add the `DeviceRegistry` and `DevicePairing` ports (ADR 0361 decision 7) with `DeviceStatus`, `PairingState` and their
types, `MemoryDeviceRegistryDriver`, `HttpDevicePairingDriver` (`POST /device-pairings`, `GET /device-pairings/:id`),
and the `StoredDeviceIdentityDriver` and `StoredDeviceCredentialDriver` over `@stackra/storage`.
