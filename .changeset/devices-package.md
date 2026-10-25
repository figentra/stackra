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

For the offline queue (ADR 0338): the `DeviceIdentity` port (`./contracts`), the device's stable id every queued call
carries, and the `./node` entry with `DeviceAcknowledgedQuery` (`devices.device.acknowledged@1`, `GET
/devices/acknowledged`), which answers a device's last acknowledged sequence from `@stackra/actions`' device sequence
store: the calling device's own, or a named device's within the caller's scope, so a shop knows what a lost till had
not sent.
