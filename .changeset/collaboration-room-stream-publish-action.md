---
"@stackra/collaboration": minor
---

Rooms over server-sent events: `openRoom` falls back to the room's event stream when the socket closes before it
opens, and sends through `RoomTokens.publish` (a new concrete method whose default rejects; override it over the
generated client). Add the `collaboration.room.publish` action (`RoomPublishAction`, `RoomPublishInput`, `./node`),
which relays one message as the member whose publish key it is. New dependencies: `@stackra/actions`,
`@stackra/transport`.
