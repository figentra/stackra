# @stackra/realtime

Stackra realtime: live, data-free refreshes from a service to the sessions allowed to see them. A service
broadcasts an integration event that declares `broadcast: { permission, audience }`. Each session that holds the
permission on the matching channel gets the event's wire name and occurrence id, never its payload, and then
refetches through its own queries.

**Tier:** `tier:lib` (`packages/runtime/realtime`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends
on `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`, `@stackra/events`,
`@stackra/transport` and zod. React is an optional peer for `./react`.

## What is here

| Entry         | Symbol                                                                                                | Use                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `.`           | `RealtimeConfig`, `RealtimeConfig$`, `RealtimeOptions`                                                | key `realtime`: server driver, realms, token lifetime, origin, reconnecting   |
| `.`           | `RealtimeStatus`                                                                                      | `connected`, `connecting`, `disconnected`                                     |
| `.`           | `RealtimeHub`                                                                                         | server channel hub: one-time subscribe tokens, joins, permission fan-out      |
| `.`           | `RealtimeBroadcaster`                                                                                 | server: turns a committed event into a refresh on its derived channel         |
| `.`           | `liveQueryRoutes`, `LiveQueryRefresh`                                                                 | server: the routes of a live (or replica) query's refresh, for gen to wire    |
| `.`           | `MemoryRealtimeDriver`, `SseRealtimeDriver`, `WebSocketRealtimeDriver`                                | the three `RealtimeDriver` drivers (`memory`, `sse`, `websocket`)             |
| `.`           | `RealtimeConnection`                                                                                  | client: one connection, reconnect with backoff, background suspension         |
| `.`           | `WebsocketRealtimeTransportDriver`, `MemoryRealtimeTransportDriver`                                   | the two `RealtimeTransport` drivers (`websocket` with SSE fallback, `memory`) |
| `.`           | `REALTIME_PATH`                                                                                       | `/realtime`, the endpoint the client and the generated raw endpoint share     |
| `./contracts` | `RealtimeDriver`, `RealtimeTransport`, `RealtimeMessage`, `RealtimeSession`, `RealtimeBroadcast`, ... | the two ports and the types they speak                                        |
| `./react`     | `useRealtimeConnection`, `useSubscription`                                                            | the connection's state; a listener for one event class                        |
| `./testing`   | `fakeRealtime`                                                                                        | a `RealtimeFake` connection a test emits events on                            |

## Channels and audience

The channel is derived from the event's broadcast, never written by hand:

- `audience: BroadcastAudience.Tenant` goes to `tenant.{tenantId}.<module>`, using the occurrence's tenant. It
  reaches every session of that tenant that holds the permission and whose realm is in `channelRealms`.
- `audience: BroadcastAudience.Principal` (the default) goes to `principal.{principalId}.<module>`. The principal is
  the event's own `principalId` field, or else the user the call acted for. It reaches only that principal's
  sessions that hold the permission.

A broadcast whose channel cannot be filled throws. It never falls back to a wider audience.

## Server

```ts
// the authenticated token endpoint (generated): the session comes from the verified actor
const { token, expiresAt } = hub.issueToken({ principalId, tenantId, realm, permissions });

// the raw endpoint at REALTIME_PATH (generated)
return sseDriver.open(request); // GET with Accept: text/event-stream
webSocketDriver.accept(socket, request.url); // after the runtime upgraded the request

// after the outbox relay, one route per broadcasting event, read from the manifest
await broadcaster.broadcast(record, {
  name: "orders.order.paid.v1",
  module: "orders",
  permission: "orders.order.read",
  audience: BroadcastAudience.Tenant,
});
```

A live query (one that declares `cache.invalidateOn`, every `replica:` query among them) refreshes on its own routes,
which `liveQueryRoutes` derives: one per invalidating event, on that event's module channel, under the query's
permission and audience (ADR 0315 decision 1). Gen hands them to the broadcaster after the relay, beside the event
routes. The client's `@stackra/query` refetches the query, or refreshes the replica by its change cursor (ADR 0338
decision 3), when the refresh arrives.

```ts
const routes = liveQueryRoutes({
  permission: "sales.sale.read",
  audience: BroadcastAudience.Tenant,
  invalidateOn: [SaleCompleted],
});
for (const route of routes) await broadcaster.broadcast(record, route); // for the events these routes name
```

Tokens are one-time. A connection is closed when its token expires (`subscribeTokenTtl`, 15 minutes by default),
so the client reconnects with a fresh token and the session's permissions are read again.

## Client

```ts
// the realtime context (createApp): after sign-in, and again on a tenant switch
connection.start(() => session.realtimeToken());

// a component or data hook
useSubscription(OrderPaid, () => query.refetch());
const status = useRealtimeConnection()?.status ?? RealtimeStatus.Disconnected;
```

The `websocket` transport opens a socket. When the socket closes before it ever opened, the transport uses a
server-sent-events stream with the same token. With `reconnectOnForeground`, the connection is suspended after
`backgroundGraceSeconds` in the background and reconnects as soon as the app is in the foreground again; the host
calls `connection.background()` and `connection.foreground()`.

## Overriding

```ts
// services/commerce/src/config/realtime.config.ts
export class RealtimeConfig extends BaseRealtimeConfig {
  override channelRealms: Realm[] = [Realm.Tenant];
  override subscribeTokenTtl = Duration.minutes(5);
}

// apps/mobile/src/config/realtime.config.ts
export class RealtimeConfig extends BaseRealtimeConfig {
  override reconnectOnForeground = true;
  override backgroundGraceSeconds = 30;
  override maxBackoffSeconds = 60;
}
```

The origin comes from the host's env configuration (`realtimeOrigin` feeds `realtime.origin`).

## Testing

```ts
const realtime = fakeRealtime();
renderRoute(Routes.orders, { realtime });
await act(() => realtime.emit(OrderPaid, { orderId }));
```

The fake is a real `RealtimeConnection`, live by default. `emit` delivers the same data-free refresh the server
would and drops the payload. `fakeRealtime({ status })` starts it at another status, and `stop()` signs it out.

## More than one instance

`RealtimeFanout` (`./contracts`) carries broadcasts and room frames between the instances of one service. Config
`realtime.fanout` picks `local` (one instance, the default) or `valkey` (`ValkeyRealtimeFanoutDriver` in `./node`, over
Valkey pub/sub on `fanoutChannel`, with the `REALTIME_VALKEY_URL` secret). `RealtimeRelay.start()` delivers what any
instance fanned out to this instance's sessions and room members; gen wires `RealtimeRelay.broadcast` in place of the
broadcaster when the fanout is not `local`.

## Rooms (ADR 0346)

A room is a two-way channel per document, in the session's tenant. The room-token endpoint checks the document's view
permission, visibility and the live-collaboration entitlement, then calls `RealtimeRooms.issueToken({ session,
document, mayEdit })`; the raw endpoint at `REALTIME_ROOM_PATH` calls `rooms.accept(socket, request.url)`. Members send
`{ t: "presence" | "awareness" | "update", data }`; the server stamps the sender, relays to the others (and through the
fanout), answers a viewer's `update` with `{ t: "refused", code: "forbidden" }`, and drops a member over a cap with
`room_limit_reached` (`RoomLimitReachedError`, close code 4429). The caps are `realtime.rooms` (members, message bytes,
messages per second, idle seconds).

## Limits today

- The member cap is per instance. Rooms ride the WebSocket only: the server-sent-events fallback and the
  `collaboration.room.publish` action path of ADR 0346 decision 5 are not built.
- Pub/sub is at most once: a refresh or room frame published while an instance reconnects is lost to it.
