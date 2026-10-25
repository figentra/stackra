---
"@stackra/realtime": minor
---

Add `@stackra/realtime`, which pushes live, data-free refreshes from a service to the sessions allowed to see them.

On the server, `RealtimeHub` issues one-time subscribe tokens for verified sessions and holds the live connections.
It checks the permission, the channel's principal or tenant and the realm (`channelRealms`) before every delivery, and
it closes each connection when its token expires. `RealtimeBroadcaster` turns a committed integration event into a
refresh on the channel derived from its broadcast audience: `tenant.{tenantId}.<module>`, or
`principal.{principalId}.<module>` by default. The refresh carries only the wire name and the occurrence id, never the
payload. The `RealtimeDriver` port (`./contracts`) has three drivers: `MemoryRealtimeDriver`, `SseRealtimeDriver`
(a `text/event-stream` response with heartbeats) and `WebSocketRealtimeDriver` (sockets, with the SSE fallback).

On the client, `RealtimeConnection` connects with a fresh token on every attempt and reconnects with capped, jittered
backoff. When configured, it suspends in the background and resumes on foreground. It hands each refresh to the
listeners of its event class. The `RealtimeTransport` port has two drivers: `WebsocketRealtimeTransportDriver`, which
falls back to server-sent events, and `MemoryRealtimeTransportDriver`.

The package also adds the `RealtimeConfig` configuration (`realtime`) with its shipped schema `RealtimeConfig$`,
`RealtimeStatus`, `REALTIME_PATH`, `useRealtimeConnection` and `useSubscription` (`./react`), and `fakeRealtime`
(`./testing`).
