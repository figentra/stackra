# Feature Specification: `@stackra/devices` wave 3, device telemetry and command ports with the HTTP driver

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/devices` (runtime, wave 3) for real: IoT telemetry and command ports and the HTTP driver.

## Impact

- **Apps touched**: none
- **Services touched**: none (a hub service serves `DEVICE_HUB_PATHS` later; not in this wave)
- **Packages touched**: `packages/runtime/devices` (new member)
- **Cross-service events**: none. Device events (`fleet.device.reported.v1`, ADR 0235 decision 3) are authored by the
  module that owns the device aggregate, not by this package
- **Tenancy and data**: no tables; no route or body names a device or tenant: the hub reads the device from its
  credential
- **Secrets**: none; the device token comes from the `DeviceCredential` port per call and is never stored or logged
- **ADR needed**: no (ADR 0235, 0207, 0260, 0294)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
  `@stackra/errors`, `@stackra/transport` through `workspace:*`; `zod` through `catalog:`
- **Deploy modes**: same in all; the drivers call only the configured hub URL
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/devices/README.md`, `packages/runtime/devices/AGENTS.md`; ADR 0120, 0127, 0207, 0235, 0260, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (a client of a hub that does not exist yet; no stored data)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entries `.` and `./contracts`, no template import; ADR 0235
  decisions 1 and 2: a telemetry port and a command port, the HTTP driver now, MQTT later; devices authenticate as
  principals in identity; ADR 0127 2026-10-21 settlement: category runtime

## User Scenarios & Testing

### User Story 1 - A device reports telemetry (Priority: P1)

A gateway app injects `DeviceTelemetry` and calls `report([{ metric, value, unit, at }])`; the HTTP driver posts one
batch to `POST {hubUrl}/devices/report` with the device's bearer token.

**Independent Test**: `src/core/drivers/__tests__/http-device-telemetry.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a hub URL and a token, **When** two readings are reported, **Then** one `POST` carries
   `{ readings }` with ISO 8601 instants, `Authorization: Bearer <token>` and an `Idempotency-Key`.
2. **Given** an empty batch, **When** it is reported, **Then** no request is sent.

### User Story 2 - A device takes and acknowledges commands (Priority: P1)

The app calls `DeviceCommands.pending()`, runs each command and calls `acknowledge(id, status, detail?)`.

**Independent Test**: `src/core/drivers/__tests__/http-device-commands.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** the hub answers `{ items }`, **When** `pending()` runs, **Then** each command comes back with `Date`
   instants; a malformed body throws `ZodError`.
2. **When** `acknowledge("cmd_1", CommandStatus.Failed, "disk full")` runs, **Then** one
   `PUT /device-commands/cmd_1/acknowledge` carries `{ status: "failed", detail: "disk full" }`.

### User Story 3 - A refused or revoked device (Priority: P2)

**Independent Test**: `src/core/functions/__tests__/hub-sender.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the hub answers 401 or 403, **Then** the call rejects with `DeviceUnauthorizedError` (not retryable).
2. **Given** a 503 then a 202, **Then** the call is retried with the same `Idempotency-Key` and resolves.
3. **Given** any other failure status after retries, **Then** the call rejects with `DeviceHubRefusedError`.
4. **Given** no answer within `timeoutMs`, **Then** the call rejects with `RequestTimedOutError`.

### User Story 4 - Configure the hub (Priority: P2)

A host overrides `DevicesConfig` (`hubUrl`, `timeoutMs`, `attempts`); the drivers refuse to start while `hubUrl` is
`null`.

**Independent Test**: `src/config/__tests__/devices.config.test.ts`.

## Requirements

- **FR-001**: Entries `.` and `./contracts` (registry row, ADR 0294 decision 15), and `./node` for the server's
  query (STA-489); `./contracts` imports no other entry, and only `./node` imports `@stackra/actions`.
- **FR-002**: `./contracts` exports `DeviceTelemetry`, `DeviceCommands`, `DeviceCredential`, `CommandStatus` and the
  types `TelemetryReading`, `DeviceCommand`; none of them is exported from `.`.
- **FR-003**: `.` exports `DevicesConfig`, `DevicesConfig$`, `DevicesOptions`, `HttpDeviceTelemetryDriver`,
  `HttpDeviceCommandsDriver`, `DeviceUnauthorizedError`, `DeviceHubRefusedError`, `DEVICE_HUB_PATHS`.
- **FR-004**: The HTTP drivers call through `@stackra/transport` (`createTransport`, `idempotencyKey`, `bearerToken`,
  `retry`, `timeout`) and follow the endpoint convention for their routes.
- **FR-005**: No route or body names the device; the token comes from `DeviceCredential` (ADR 0235 decision 1).
- **FR-006**: The pending-commands body is parsed with a zod schema at the trust boundary.
- **FR-007**: (ADR 0338 decision 1) the `DeviceIdentity` port in `./contracts` (key `devices.DeviceIdentity`): the
  device's stable id, which every queued call of the offline queue carries.
- **FR-008**: (ADR 0338 decision 4) `DeviceAcknowledgedQuery` in `./node`, `devices.device.acknowledged@1` on `GET
/devices/acknowledged` (the `DEVICE_ORDER` names of `@stackra/clients`): with no input, the calling device's
  (`ctx.deviceId`) last acknowledged sequence from `@stackra/actions`' `DeviceSequenceStore` as `{ sequence: number |
null }`, refused `input_invalid` without a verified device; with a `deviceId`, that device's only when its last
  settled call acted within the caller's scope, else `null`.

## Success Criteria

- **SC-001** (template imports): the template imports nothing from `@stackra/devices`; nothing to satisfy.
- **SC-002** (registry contract): entries `.` and `./contracts`; IoT telemetry and command ports; the HTTP driver.
- **SC-003**: every public symbol has a test beside it; the barrel tests pin each entry's exports.
- **SC-004**: format and lint pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- The MQTT driver (ADR 0235 decision 2: later).
- Firmware and over-the-air updates, fleet dashboards, edge sync (ADR 0235 decision 4 asks for contracts and stubs;
  the build rules forbid stubs and speculative API, so they wait for their own issue).
- The hub service that serves `DEVICE_HUB_PATHS`, and the device registry in identity (ADR 0235 decision 1).
- A dependency on `@stackra/events`: the registry row lists it, but no symbol of this package needs it; device events
  belong to the owning module.
- A memory driver or `./testing` entry: the registry row allows `.` and `./contracts` only.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
