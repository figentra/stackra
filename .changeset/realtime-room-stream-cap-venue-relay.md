---
"@stackra/realtime": minor
---

Rooms: `RealtimeRooms.stream(request)` serves a member over server-sent events when its socket cannot open; every
`welcome` frame carries the membership's publish `key`, and `publishFrom(key, principalId, message)` relays a stream
member's message (from `collaboration.room.publish`) on whichever instance holds it, through the new `room-publish`
fanout message. The member cap counts every instance (`rooms.countAcrossInstances`, on by default) from the counts the
instances fan out (`room-members`, and `members` on room frames). Venue relay: the `lan` `RealtimeLocalRelay` driver
(`LanRealtimeLocalRelayDriver`, `./node`) hosts and discovers a local-network relay, keyed by the
`REALTIME_LOCAL_RELAY_KEY` secret, with the `localRelay*` settings. A `RoomFrame` welcome now requires `key`.
