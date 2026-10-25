# @stackra/devices

Stackra devices: the ports a device app (a sensor gateway, a kiosk, a till) reports telemetry, takes commands and
orders its offline calls through, the `DevicesConfig` configuration, the HTTP drivers over `@stackra/transport`, and
the server's query of a device's last acknowledged sequence. An MQTT driver comes later behind the same ports (ADR
0235).

**Tier:** `tier:lib` (`packages/runtime/devices`). Entries `.`, `./contracts` and `./node` (server only). Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/transport`, zod, and `@stackra/actions` for `./node`.

## What is here

| Symbol                                                | Entry         | Use                                                              |
| ----------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `DeviceTelemetry`                                     | `./contracts` | the port: `report(readings)`                                     |
| `DeviceCommands`                                      | `./contracts` | the port: `pending()`, `acknowledge(commandId, status, detail?)` |
| `DeviceCredential`                                    | `./contracts` | the port identity binds: `token()`, the device's access token    |
| `DeviceIdentity`                                      | `./contracts` | the port identity binds: `id()`, the device's stable id          |
| `CommandStatus`                                       | `./contracts` | `Done`, `Failed`, `Rejected`                                     |
| `TelemetryReading`, `DeviceCommand`                   | `./contracts` | the wire types                                                   |
| `DevicesConfig`, `DevicesConfig$`, `DevicesOptions`   | `.`           | key `devices.devices`: `hubUrl`, `timeoutMs`, `attempts`         |
| `HttpDeviceTelemetryDriver`                           | `.`           | the HTTP driver of `DeviceTelemetry`                             |
| `HttpDeviceCommandsDriver`                            | `.`           | the HTTP driver of `DeviceCommands`                              |
| `DeviceUnauthorizedError`                             | `.`           | the hub answered 401 or 403; not retryable                       |
| `DeviceHubRefusedError`                               | `.`           | any other failure status after retries; retryable                |
| `DEVICE_HUB_PATHS`                                    | `.`           | the hub routes the drivers call, for the hub service to serve    |
| `DeviceAcknowledgedQuery`                             | `./node`      | `devices.device.acknowledged@1`: a device's last acknowledged    |
| `DeviceAcknowledgedInput`, `DeviceAcknowledgedOutput` | `./node`      | `{ deviceId? }` and `{ sequence: number \| null }`               |

## Reporting and taking commands

```ts
import { CommandStatus, DeviceCommands, DeviceTelemetry } from "@stackra/devices/contracts";

export class GatewayService extends Service {
  constructor(
    private readonly telemetry: DeviceTelemetry,
    private readonly commands: DeviceCommands,
    private readonly clock: Clock,
  ) {
    super();
  }

  async cycle(temperature: number): Promise<void> {
    await this.telemetry.report([
      { metric: "temperature", value: temperature, unit: "celsius", at: this.clock.now() },
    ]);
    for (const command of await this.commands.pending()) {
      const status = command.name === "reboot" ? CommandStatus.Done : CommandStatus.Rejected;
      await this.commands.acknowledge(command.id, status);
    }
  }
}
```

## The HTTP protocol

| Call          | Route                                               | Body                                                              |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `report`      | `POST /devices/report`                              | `{ readings: [{ metric, value, unit?, at }] }`                    |
| `pending`     | `GET /device-commands`                              | answers `{ items: [{ id, name, payload, issuedAt, expiresAt }] }` |
| `acknowledge` | `PUT /device-commands/:deviceCommandId/acknowledge` | `{ status, detail? }`                                             |

- Every route sits under `DevicesConfig.hubUrl`; no route or body names the device: the hub reads it from the bearer
  token that `DeviceCredential` supplies (ADR 0235 decision 1). An mTLS device's credential answers `undefined`.
- A `report` carries an `Idempotency-Key`, kept across its retries, so the hub stores a batch once. `pending` and
  `acknowledge` are idempotent.
- A network failure, a timeout, a 429 or a 503 is retried up to `attempts`. Then a 401 or 403 rejects with
  `DeviceUnauthorizedError` and any other failure status with `DeviceHubRefusedError`; the body is never read or kept.
- The drivers refuse to start while `hubUrl` is `null` (the default).

## The offline queue's order

A till queues its calls while offline and replays them in order (ADR 0338 decision 1). `DeviceIdentity.id()` is the id
`@stackra/query`'s queue stamps on each call, with a per-device sequence; `@stackra/clients` sends both in the
`DEVICE_ORDER` headers, and `@stackra/actions` applies one device's calls in order and records the last one settled.

`DeviceAcknowledgedQuery` (`GET /devices/acknowledged`, the `DEVICE_ORDER.acknowledgedQuery` key) answers that last
acknowledged sequence. With no input it answers for the calling device, which the transport verified from the
`DEVICE_ORDER.deviceHeader`; the client reads it as proof of a sync. With `{ deviceId }` it answers another device's,
only when that device's last settled call acted within the caller's scope, so a shop can see what a lost or revoked
till had not sent (ADR 0338 decision 4). The host binds a `DeviceSequenceStore` driver (the memory one ships with
`@stackra/actions`).

Governing ADRs: 0235 (devices and IoT), 0207 (machine identities), 0260 (transport), 0294 (kinds, entries, drivers),
0338 (the offline queue).
