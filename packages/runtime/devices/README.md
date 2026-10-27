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
| `DeviceRegistry`, `DevicePairing`                     | `./contracts` | the registry (server) and pairing (device) ports (ADR 0361 d7)   |
| `DeviceStatus`, `PairingState`                        | `./contracts` | `active`/`retired`; `pending`/`paired`/`expired`                 |
| `RegisteredDevice`, `DeviceDraft`, `DeviceListQuery`  | `./contracts` | the registry's record, what a person gives, a filter             |
| `PairingCode`, `PairingRequest`, `PairingStatus`      | `./contracts` | the code shown, what opens it, what the device learns            |
| `MemoryDeviceRegistryDriver`                          | `.`           | the registry's `memory` driver                                   |
| `HttpDevicePairingDriver`                             | `.`           | pairing over the hub; keeps the token in `secrets`               |
| `StoredDeviceIdentityDriver`                          | `.`           | `DeviceIdentity`: the install id, minted once in `prefs`         |
| `StoredDeviceCredentialDriver`                        | `.`           | `DeviceCredential`: the token kept at pairing                    |
| `PairingCodeInvalidError`, `DEVICE_STORAGE_KEYS`      | `.`           | the registry's refusal; the storage keys the drivers share       |
| `PAIRING_CODE_ALPHABET`, `newPairingCode`             | `.`           | the code alphabet and generator, for a registry driver elsewhere |
| `DeviceClaimFacts`                                    | `./contracts` | a claim's `scopeId`, `market` and `pairedBy`, kept on the row   |
| `DeviceKind`, `BASE_DEVICE_CATALOGUE`                 | both          | catalogue kinds with `counted` and `fiscalUnit`; the base rows   |
| `deviceCatalogueOf`                                   | `.`           | reads and checks catalogue rows into `DeviceKind`s               |
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

## Pairing and the registry

```ts
// the device (a till): show a code, poll until a person enters it
const pairing = await devicePairing.begin(); // POST /device-pairings { deviceId: <install id> }
let status = await devicePairing.check(pairing); // GET /device-pairings/:pairingId
// once paired, the token is in the secrets area and StoredDeviceCredentialDriver answers it

// the devices service: open, claim, list, retire
const code = await registry.openPairing({ deviceId, at: clock.now(), expiresAt }); // the lifetime is a setting
const device = await registry.claim(
  input.code,
  { name: "Till 2", kind: "till", nodeId },
  clock.now(),
  { scopeId: ctx.scopeId, market, pairedBy: ctx.principalId }, // optional; each fact null when left out
);
await registry.retire(device.id, clock.now()); // then identity revokes the credential
```

- The device's id is its install id, registered as is, so the offline queue's order (below) survives pairing.
- A code is single use; an unknown, used or expired code refuses with `PairingCodeInvalidError`, which never says
  which.
- A driver over another store draws its codes with `newPairingCode` (from `PAIRING_CODE_ALPHABET`), so every registry
  accepts the same codes.

## Device kinds

A kind is catalogue data (ADR 0430): `BASE_DEVICE_CATALOGUE` is the seed every product starts from, and
`deviceCatalogueOf(rows)` checks rows into `DeviceKind`s. Besides `unattended`, `customerFacing` and `peripherals`, a
row carries `counted` (counts against the plan's `devices` limit; default true) and `fiscalUnit` (registered with the
market's fiscal mandate during pairing; default false). The devices service reads the flags; nothing here enforces the
limit or opens a registration.

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
