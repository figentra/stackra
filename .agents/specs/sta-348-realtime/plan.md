# Plan: `@stackra/realtime` wave 3

**Spec**: `.agents/specs/sta-348-realtime/spec.md`

## Design

- **Ports** (`./contracts`). `RealtimeDriver` (server, `publish(broadcast): Promise<number>`) and `RealtimeTransport`
  (client, `open(target, handlers): RealtimeLink`). Both carry a type-only `~key`, and the two `*Name` types augment
  `DriverRegistry` with the names gen writes.
- **Wire**. One frame, `RealtimeMessage = { channel, name, id }`, as JSON over a socket or as `event: refresh` with
  `id:` over SSE. `decodeMessage` is the client's trust boundary.
- **Server**.
  - `RealtimeHub` issues one-time tokens (`crypto.randomUUID`, TTL `subscribeTokenTtl`).
  - `join(token, peer)` redeems a token and closes the peer at its expiry.
  - `publish` runs `mayReceive` (the permission, plus a principal channel that is the session's own, or a tenant
    channel that is the session's own with an allowed realm) and drops a throwing peer.
  - The drivers: `MemoryRealtimeDriver.connect(token, listener)`; `SseRealtimeDriver.open(request)` returns a
    `Response` stream with a 25 s heartbeat, 401 for a bad token and 426 for an upgrade;
    `WebSocketRealtimeDriver extends SseRealtimeDriver` and adds `accept(socket, url)` (4401, 4001).
- **Broadcast**. `RealtimeBroadcaster.broadcast(record, route)` takes `route = { name, module, permission, audience }`
  and derives the channel through `broadcastChannel`. The tenant comes from `meta.tenantId`. The principal comes from
  the event's `principalId`, else `actor.onBehalfOf ?? actor` when that actor is a user. It throws on a gap.
- **Client**. `RealtimeConnection extends Service`:
  - `start(tokens)` and `stop()`; `state` is a frozen `{ status }` or `null`, with `subscribeState` for
    `useSyncExternalStore`.
  - A generation ticket ignores stale links.
  - `backoffDelay` (equal jitter, 1 s doubling, capped) on loss.
  - `background()` and `foreground()` handle suspension when `reconnectOnForeground` is set.
  - `subscribe(eventRef, listener)` is keyed by `eventRef.eventName`.
  - `WebsocketRealtimeTransportDriver` uses the global `WebSocket`. On a close before open, it falls back to `fetch` +
    `readServerSentEvents`, decided per link. `MemoryRealtimeTransportDriver` has `emit` and `drop`.
- **Config**. `RealtimeOptions` (schema class, `@Int` on the seconds fields) registers `REALTIME_CONFIG_SCHEMA`,
  exported as `RealtimeConfig$`. `RealtimeConfig = Config({ schema: RealtimeOptions })`, key `realtime`.
- **React**. `useRealtimeConnection` uses `useSyncExternalStore`. `useSubscription` uses `useEffect` and
  `useEffectEvent`.
- **Testing**. `RealtimeFake extends RealtimeConnection` over the memory transport. It adds `emit(event, payload?)`,
  which delivers data-free, and a public `setStatus`. `fakeRealtime({ status })` builds one.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                         |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/realtime`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/events`, `@stackra/transport`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                          |
| Security                              | PASS   | an authorisation check on every delivery; subscribe tokens are random, one-time and held in memory only                                                                                                                                      |
| HTTP and events                       | PASS   | the package delivers the broadcasts that integration events already declare; it declares no endpoint of its own                                                                                                                              |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                                               |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                       |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                             |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                                            |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                      |

- Boundaries: runtime imports are `@stackra/{contracts,container,validation,config,events,transport}`, `zod` and
  `react` (peer). There is no app, service, `encore.dev` or socket library. `./contracts` imports no other entry.
  `./testing` imports `.` only.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1, `<name>.<kind>.ts`. The gen samples' driver names are kept as written (`WebSocketRealtimeDriver`,
  `WebsocketRealtimeTransportDriver`).
- Secrets: none. No parameter properties and no `#private` fields (erasable syntax).

## Deploy modes

| Mode       | Behaviour                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                                                                                     |
| On-prem    | identical: the same build, no SaaS-only code path                                                                                                    |
| Air-gapped | identical: the memory driver needs no network, and the SSE or WebSocket transport is configured by the consumer, so the package makes no call itself |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react` and `./testing` — Validates: FR-001
- **P-002**: every template import resolves: `.` exports `RealtimeConfig` (its seven fields), `RealtimeConfig$` (each field `.unwrap()`-able), `RealtimeStatus` (`Connected`, `Connecting`, `Disconnected`) and `MemoryRealtimeDriver`, `./contracts` exports `RealtimeDriver` and `RealtimeTransport`, `./react` exports `useRealtimeConnection` and `useSubscription`, and `./testing` exports `fakeRealtime` — Validates: FR-002
- **P-003**: the channel hub reconnects with a backoff capped at `maxBackoffSeconds` and delivers a broadcast only to the audience its `broadcast: { permission, audience }` names (ADR 0294 amendment item 7) — Validates: FR-003
- **P-004**: a delivery carries no payload field to a client, and nothing is delivered to a session that lacks the permission — Validates: FR-004
- **P-005**: `SseRealtimeDriver`, `WebSocketRealtimeDriver` and `WebsocketRealtimeTransportDriver` are exported from `.` — Validates: FR-005
- **P-006**: for every live query, `liveQueryRoutes` returns exactly one route per distinct invalidating event, each with the event's wire name, the module that is its first label, the query's permission and its audience; and a session reaches a refresh on such a route only when it holds the query's permission — Validates: FR-006
