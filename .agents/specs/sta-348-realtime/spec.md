# Feature Specification: `@stackra/realtime` wave 3: channel hub, drivers, reconnecting connection, broadcast audience

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/realtime` (runtime, wave 3) for real: the channel hub, reconnect, the drivers and the
broadcast audience.

## Impact

- **Apps touched**: none. The template's console and mobile use the hooks, the fake and the config (STA-344)
- **Services touched**: none. The template's commerce service overrides the config
- **Packages touched**: `packages/runtime/realtime` (new member)
- **Cross-service events**: none new. The package delivers the broadcasts that integration events already declare
- **Tenancy and data**: no tables. Sessions hold public ids and permission names in memory only
- **Secrets**: none. Subscribe tokens are random, one-time and in memory
- **ADR needed**: no (ADR 0225 with its notes, 0294 amendment item 7 and decisions 4, 15 to 17, 19, 20 and 26, 0141,
  0266, 0269, the ADR 0127 2026-10-24 note)
- **New dependencies**: none new. Workspace packages through `workspace:*`; `zod` through `catalog:`; `react` through
  `catalog:frontend` as an optional peer; Testing Library and jsdom as dev dependencies (already catalogued)
- **Deploy modes**: same in all; the package makes no outbound call itself (transport and drivers are configured by the consumer)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/realtime/README.md`, `packages/runtime/realtime/AGENTS.md`; ADR 0120, 0127, 0141, 0225, 0266, 0269, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (an authorisation check on every delivery; a mistake would leak a refresh signal, never data)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- The registry v3.1 row gives the entries `.`, `./contracts`, `./react` and `./testing`, and the dependencies
  transport and events.
- ADR 0225 (WebSocket with an SSE fallback; IAM authorises each channel), its 2026-10-23 note and ADR 0294 amendment
  item 7 (`broadcast: { permission, audience }`, default principal, data-free refresh) set the behaviour.
- The template's gen samples import `SseRealtimeDriver` and `WebSocketRealtimeDriver` from `./node` and
  `WebsocketRealtimeTransportDriver` from `./browser` and `./native`. Those entries are not built: every driver
  uses web-standard APIs only and ships from `.`, and one symbol cannot come from two entries (see Open items).
- `useSubscription` takes the generated event class. Its contract here is structural: a class with a static
  `eventName` (the wire name). `@stackra/clients`' `eventRef(name, ...)` must set it.

## User Scenarios & Testing

### User Story 1 - A component reacts to a broadcast (Priority: P1)

`useSubscription(OrderPaid, () => query.refetch())` refetches when the connection reports a paid order.

**Independent Test**: `src/react/realtime/__tests__/use-subscription.test.tsx`,
`src/core/services/__tests__/realtime-connection.service.test.ts`.

1. **Given** a refresh of `orders.order.paid.v1`, **Then** the listener runs; **given** another event, **Then** it
   does not.
2. **Given** an unmounted component, **Then** its listener no longer runs; a server render subscribes nothing.

### User Story 2 - The connection indicator shows the status (Priority: P1)

**Independent Test**: `src/react/realtime/__tests__/use-realtime-connection.test.tsx`.

1. **Given** a live connection, **Then** `useRealtimeConnection()` is `{ status: "connected" }`; signed out it is
   `null`; a status change re-renders.

### User Story 3 - The client reconnects and spares the battery (Priority: P1)

**Independent Test**: `src/core/services/__tests__/realtime-connection.service.test.ts`.

1. **Given** a lost link, **Then** the status is `disconnected` and a new attempt with a fresh token follows after a
   jittered backoff capped at `maxBackoffSeconds`.
2. **Given** a token source answering `undefined`, **Then** the connection stops (`null`).
3. **Given** `reconnectOnForeground`, **Then** the link closes after `backgroundGraceSeconds` in the background and
   reopens at once on foreground; by default it stays open.

### User Story 4 - A service broadcasts to the right sessions only (Priority: P1)

**Independent Test**: `src/core/services/__tests__/realtime-broadcaster.service.test.ts`,
`src/core/functions/__tests__/{broadcast-channel,may-receive}.function.test.ts`,
`src/core/services/__tests__/realtime-hub.service.test.ts`.

1. **Given** `OrderPaid` (tenant audience), **Then** the message goes to `tenant.{tenantId}.orders` with the
   permission `orders.order.read`, and holds no payload field.
2. **Given** `InboxMessageCreated` (principal audience), **Then** it goes to `principal.{principalId}.messages`.
3. **Given** a session without the permission, of another tenant or principal, or of a realm outside
   `channelRealms`, **Then** it receives nothing.
4. **Given** an occurrence without its audience id, **Then** the broadcast rejects and nothing is published.

### User Story 5 - Sessions connect over WebSocket or SSE (Priority: P1)

**Independent Test**: the five driver tests in `src/core/drivers/__tests__/`.

1. **Given** a one-time token, **Then** a socket or an event stream joins the hub; a reused or unknown token gets
   4401 or 401; a WebSocket upgrade sent to the SSE route gets 426 without spending the token.
2. **Given** the token's expiry, **Then** the connection is closed (4001 for a socket).
3. **Given** a client socket that closes before it opened, **Then** the client falls back to the event stream with the
   same token.

### User Story 6 - A test emits an event (Priority: P2)

**Independent Test**: `src/testing/__tests__/realtime.fake.test.ts`,
`src/testing/functions/__tests__/fake-realtime.function.test.ts`.

1. **Given** `fakeRealtime()`, **Then** it is a live `RealtimeConnection`; `emit(OrderPaid, payload)` delivers the
   data-free refresh; `fakeRealtime({ status })` starts at that status.

## Requirements

- **FR-001**: The member files and the entries `.`, `./contracts`, `./react` and `./testing`, and no others.
- **FR-002**: (template contract) every symbol the template imports exists with the shape it uses. `.`:
  `RealtimeConfig` (fields `reconnectOnForeground`, `backgroundGraceSeconds`, `maxBackoffSeconds`, `channelRealms:
Realm[]`, `subscribeTokenTtl: Duration`, `driver`, `origin`), `RealtimeConfig$` (each field `.unwrap()`-able),
  `RealtimeStatus` (`Connected`, `Connecting`, `Disconnected`), `MemoryRealtimeDriver`. `./contracts`:
  `RealtimeDriver` (key `realtime.RealtimeDriver`, drivers `sse | websocket | memory`), `RealtimeTransport` (key
  `realtime.RealtimeTransport`, drivers `websocket | memory`). `./react`: `useRealtimeConnection()` returning
  `{ status } | null`, `useSubscription(EventClass, listener)`. `./testing`: `fakeRealtime()` with
  `emit(EventClass, payload)`.
- **FR-003**: (registry contract) channel hub, reconnect, drivers, broadcast audience (0294 amendment item 7).
- **FR-004**: No payload field ever reaches a client; no delivery without the permission.
- **FR-005**: The gen samples' `SseRealtimeDriver`, `WebSocketRealtimeDriver` and `WebsocketRealtimeTransportDriver`
  exist, exported from `.`.

## Open items

- Gen must import the server and client drivers from `.`, not from `./node`, `./browser` or `./native` (one symbol
  from one entry; the drivers need no runtime-target entry).
- `@stackra/clients`' `eventRef` must expose the wire name as the static `eventName`.
- The token endpoint and the raw `REALTIME_PATH` endpoint are written by gen (`Controller` home is still A13).
- Multi-instance fan-out (a Valkey or Postgres pub/sub driver) is not built; tokens and connections are per process.

## Success Criteria

- **SC-001**: Every template import resolves (the barrel tests list the exports exactly).
- **SC-002**: Every public symbol has a test beside it; tests run in the separate testing workflow.
- **SC-003**: Format and lint are clean.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
