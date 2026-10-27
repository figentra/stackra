# AGENTS — @stackra/realtime

The realtime hub, the broadcaster, the client connection and the drivers of both ports. Member at
`packages/runtime/realtime` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                   | It goes in…                                    |
| ---------------------------------- | ---------------------------------------------- |
| A port or a type it speaks         | `src/contracts/{ports,types}/`                 |
| The configuration                  | `src/config/realtime.config.ts`                |
| A server or client driver          | `src/core/drivers/<name>.driver.ts`            |
| A driver on a server library       | `src/node/drivers/<name>.driver.ts`            |
| The hub, broadcaster or connection | `src/core/services/`                           |
| A pure helper                      | `src/core/functions/`                          |
| React code                         | `src/react/realtime/`                          |
| A test helper                      | `src/testing/`                                 |
| A test                             | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- A refresh carries the channel, the wire name and the occurrence id only, never the payload (ADR 0225).
- The channel is derived from the broadcast's audience. Never accept a channel from a client, and never widen a
  channel that cannot be filled.
- Every delivery checks the permission and the channel ids (`mayReceive`). Deny by default.
- A live query's refresh rides the same data-free message under the query's permission (`liveQueryRoutes`); its
  module comes from the event's wire name, never from a written string.
- Subscribe tokens are one-time and short-lived; a connection closes at the token's expiry.
- `./contracts` imports no other entry; `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).
- Anything that imports `iovalkey` (or another server library) goes in `src/node/`; `.` stays web-standard.
- Rooms take their grant from the server's checks, never from the client; the sender of every relayed frame is the
  server's stamp. A cap is enforced with `room_limit_reached`, never silently. Room payloads are relayed, never stored.
- A fanned-out room frame carries its origin instance; never deliver an instance's own frame twice. It also carries
  that instance's member count of the room, which the cross-instance cap (`rooms.countAcrossInstances`) reads.
- A room publish key (`welcome.key`) is the membership's secret: it works only for the member's own principal, is never
  relayed and never logged. `publishFrom` runs the same checks as a socket message.
- The venue relay (`lan`, `src/node/drivers/`) refuses every request without the `REALTIME_LOCAL_RELAY_KEY` venue key,
  compared in constant time, and keeps nothing.
- `memory` RealtimeFanout (STA-1308): `MemoryRealtimeFanoutDriver` delivers like `local` (a macrotask after `publish`)
  and keeps `published` for assertions. `RealtimeFanoutName` lists `memory`; keep it in step with the drivers.
- `RealtimeHealthIndicatorDriver` is the `HealthIndicator` driver: it publishes a zero member count for the probe room `health:probe` through the `RealtimeFanout`, which every receiver drops, bounded by `health.timeout`; `health.critical: false` reports `degraded` instead of `down`. It reports the error's name, never its message.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                            | Where                   | Handling                                                      |
| ------------------------------- | ----------------------- | ------------------------------------------------------------- |
| Principal and tenant public ids | channel names, sessions | Ids only; held in memory for the life of a token. Not stored. |
| Event payload                   | never                   | Dropped by the broadcaster; never sent to a client.           |
