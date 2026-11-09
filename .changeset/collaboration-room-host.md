---
"@stackra/collaboration": minor
"@stackra/realtime": minor
"@stackra/gen": minor
---

Collaboration rooms are hosted with no hand wiring. A model declares `@Collaborative({ view, edit })`, and a service
that declares `@stackra/collaboration` serves `collaboration.room.token@1` (the checked one-time room token: the record
in the caller's tenant, its view permission, `LiveCollaborationEntitlement` for the scope, `mayEdit` from its edit
permission), `collaboration.room.publish@1` and `RoomController`, the room's event stream at `REALTIME_ROOM_PATH`,
through the package's new root `CollaborationModule`. `RoomMemberRole` (`collaboration.room_member`) grants the two L2 room
permissions. A client binds `RoomTokens` to `ClientRoomTokensDriver` over its
`DynamicClient`.

`RoomGrant.recheckEdit` (realtime): the room asks the edit right again before relaying each `update`, so a permission
revoked mid-session drops the member's next edit; `RoomMember.publish` returns a promise for such an update.

Gen: a package manifest lists its raw controllers in `services` with their `path`; a host binds a hosted package's
controllers, and its Encore `api.ts` serves a hosted package's actions, queries and controllers (the package needs an
authored root module); `endpoint_collision` also counts raw controllers (own and hosted, any method, a trailing `/*`
covering what is under it); the generated HTTP adapter streams answer bodies instead of buffering them.
