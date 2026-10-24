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

## Constitution check

- Boundaries: imports `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
  `@stackra/errors`, `@stackra/transport` and `zod` only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`, errors `<Name>Error`; no tenant word.
- Secrets: none; the token is read per call and never stored or logged.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).
