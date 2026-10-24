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

## Constitution check

- Boundaries: runtime imports are `@stackra/{contracts,container,validation,config,events,transport}`, `zod` and
  `react` (peer). There is no app, service, `encore.dev` or socket library. `./contracts` imports no other entry.
  `./testing` imports `.` only.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1, `<name>.<kind>.ts`. The gen samples' driver names are kept as written (`WebSocketRealtimeDriver`,
  `WebsocketRealtimeTransportDriver`).
- Secrets: none. No parameter properties and no `#private` fields (erasable syntax).
