# AGENTS — @stackra/devices

Device telemetry and command ports and their HTTP drivers. Member at `packages/runtime/devices` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` and `./node` (the server's query).

## Where code goes

| You are writing…              | It goes in…                                 |
| ----------------------------- | ------------------------------------------- |
| A port                        | `src/contracts/ports/<name>.port.ts`        |
| An enum or type a port needs  | `src/contracts/{enums,types}/`              |
| A driver                      | `src/core/drivers/<name>.driver.ts`         |
| A refusal                     | `src/core/errors/<name>.error.ts`           |
| A function, a constant, shape | `src/core/{functions,constants,schemas}/`   |
| The configuration             | `src/config/devices.config.ts`              |
| A query or its input/output   | `src/node/{queries,schemas}/`               |
| A test                        | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- The ports, `CommandStatus` and the wire types are exported from `./contracts` only. `./contracts` imports no other
  entry. Only `./node` imports `@stackra/actions`: a device app never loads the pipeline.
- The acknowledged query's wire names (key, route, `{ sequence }`) are `DEVICE_ORDER` of `@stackra/clients`; keep them
  equal. The calling device is `ctx.deviceId`, never input.

## This package

- Every HTTP call goes through `hubSender`: idempotency key, bearer token, retry, timeout, refusals. A new driver
  call reuses it.
- No route or body names the device; the hub reads it from the credential (ADR 0235 decision 1).
- Firmware, over-the-air updates, fleet dashboards and edge sync are not here (ADR 0235 decision 4); add them only
  with their own issue.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data             | Where               | Handling                                                             |
| ---------------- | ------------------- | -------------------------------------------------------------------- |
| Device token     | request header only | Read from `DeviceCredential` per call; never stored or logged here.  |
| Telemetry values | request body only   | Sent as given; never logged here. A refused response body is unread. |
