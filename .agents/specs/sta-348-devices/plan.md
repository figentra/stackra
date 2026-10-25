# Plan: `@stackra/devices` wave 3

**Spec**: `.agents/specs/sta-348-devices/spec.md`

## Design

- Three ports in `src/contracts/ports/`, each an abstract class extending `Port`: `DeviceTelemetry.report(readings)`,
  `DeviceCommands.pending()` and `acknowledge(commandId, status, detail?)`, `DeviceCredential.token()`. `CommandStatus`
  (`Enum.of`) and the types `TelemetryReading` and `DeviceCommand` sit beside them. All exported from `./contracts`.
- `DevicesOptions` (shape) registers `DEVICES_CONFIG_SCHEMA` (`hubUrl` nullable URL, `timeoutMs`, `attempts` 1 to 10);
  `DevicesConfig` is `Config({ schema: DevicesOptions })`; the barrel exports the schema as `DevicesConfig$`.
- `hubSender(config, credential)` (internal function) is the one call path: it refuses a `null` hub URL, builds
  `createTransport({ middleware: [idempotencyKey(), bearerToken(...), retry({ attempts }), timeout(...)] })`, joins
  the trimmed hub URL and the path, and maps a failure status to `DeviceUnauthorizedError` (401, 403) or
  `DeviceHubRefusedError` (anything else), cancelling the body unread.
- `HttpDeviceTelemetryDriver extends Driver(DeviceTelemetry)` posts `{ readings }`; `HttpDeviceCommandsDriver`
  (`extends Driver(DeviceCommands)`) reads `GET /device-commands` through `DEVICE_COMMAND_LIST_SCHEMA`
  (internal) and acknowledges with a `PUT`. Both take `DevicesConfig` and `DeviceCredential` by constructor type.
- `DEVICE_HUB_PATHS` names the routes by the endpoint convention: `POST /devices/report`, `GET /device-commands`,
  `PUT /device-commands/:deviceCommandId/acknowledge`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                        |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/devices`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/transport`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                         |
| Security                              | PASS   | devices authenticate as principals through `DeviceCredential`; no route or body names the device (ADR 0235 decision 1)                                                                                                                      |
| HTTP and events                       | N/A    | no action or event; the HTTP drivers call the device hub through `@stackra/transport`                                                                                                                                                       |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                                              |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                      |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                             |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                     |

- Boundaries: imports `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
  `@stackra/errors`, `@stackra/transport` and `zod` only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`, errors `<Name>Error`; no tenant word.
- Secrets: none; the token is read per call and never stored or logged.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                                          |
| On-prem    | identical: the same build, no SaaS-only code path                                                         |
| Air-gapped | identical: the package makes no call itself; the hub URL and the transport are configured by the consumer |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts` and `./node`, `src/contracts/` imports no other entry, and no file outside `src/node/` imports `@stackra/actions` — Validates: FR-001
- **P-002**: `./contracts` exports `DeviceTelemetry`, `DeviceCommands`, `DeviceCredential`, `CommandStatus`, `TelemetryReading` and `DeviceCommand`, and `.` exports none of them — Validates: FR-002
- **P-003**: `.` exports `DevicesConfig`, `DevicesConfig$`, `DevicesOptions`, `HttpDeviceTelemetryDriver`, `HttpDeviceCommandsDriver`, `DeviceUnauthorizedError`, `DeviceHubRefusedError` and `DEVICE_HUB_PATHS` — Validates: FR-003
- **P-004**: `HttpDeviceTelemetryDriver` and `HttpDeviceCommandsDriver` send every request through a `@stackra/transport` transport (`createTransport` with `idempotencyKey`, `bearerToken`, `retry` and `timeout`) to a path in `DEVICE_HUB_PATHS` — Validates: FR-004
- **P-005**: no path in `DEVICE_HUB_PATHS` and no request body names the device, and the bearer token comes from `DeviceCredential` — Validates: FR-005
- **P-006**: the pending-commands response body is parsed with a zod schema before any command is returned — Validates: FR-006
- **P-007**: `DeviceIdentity` is a `Port` keyed `devices.DeviceIdentity`, exported from `./contracts` only — Validates: FR-007
- **P-008**: for every store state and caller, `DeviceAcknowledgedQuery` answers the calling device's last settled sequence (or `null`), and for a named device answers a sequence only when the device's last settled scope path is the caller's or below it (any for a platform caller), else `null` — Validates: FR-008
