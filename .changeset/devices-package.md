---
"@stackra/devices": minor
---

Add `@stackra/devices`, the minimal device support of ADR 0235: the `DeviceTelemetry` port (`report(readings)`), the
`DeviceCommands` port (`pending()`, `acknowledge(commandId, status, detail?)`), the `DeviceCredential` port identity
binds, the `CommandStatus` enum and the `TelemetryReading` and `DeviceCommand` types (all from `./contracts`); the
`DevicesConfig` configuration (`devices.devices`: `hubUrl`, `timeoutMs`, `attempts`) with its shipped schema
`DevicesConfig$`; and the HTTP drivers `HttpDeviceTelemetryDriver` and `HttpDeviceCommandsDriver` over
`@stackra/transport` (idempotency key, bearer token, retry, timeout), which reject with `DeviceUnauthorizedError` on a
401 or 403 and `DeviceHubRefusedError` on any other failure status, and the `DEVICE_HUB_PATHS` routes they call.
