# @stackra/collaboration

Stackra collaboration: presence, cursors, the Yjs binding and snapshots for the builder's documents, and comments on
any `Commentable` record (threads, revisions, tombstones and mentions, ADR 0433). The code is free; live collaboration
is unlocked per scope by `LiveCollaborationEntitlement` (ADR 0270 decision 5, ADR 0202). Comments are core and take no
entitlement.

**Tier:** `tier:lib` (`packages/experience/collaboration`). Entries `.`, `./contracts`, `./node`, `./react` and
`./testing`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
`@stackra/errors`, `@stackra/entitlements`, `@stackra/realtime`, `@stackra/database`, `@stackra/model`,
`@stackra/events`, `@stackra/actions`, `@stackra/transport` and zod. React and Yjs are optional peers for `./react`.

## What is here

| Entry         | Symbol                                                                                  | Use                                                            |
| ------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `.`           | `CollaborationConfig`, `CollaborationConfig$`, `CollaborationOptions`                   | key `collaboration`: cursor send interval, snapshot interval   |
| `.`           | `LiveCollaborationEntitlement`                                                          | the feature right (`collaboration.live_collaboration`)         |
| `.`           | `CollaborationSession`                                                                  | joins rooms, keeps presence, throttles cursors, binds replicas |
| `.`           | `SnapshotService`                                                                       | restores, saves and autosaves a document's state               |
| `./contracts` | `PresenceChannel`, `SyncTransport`, `SnapshotStore`                                     | the three ports a host binds                                   |
| `./contracts` | `CollaborationRoom`, `PresencePeer`, `DocumentReplica`, `DocumentSnapshot`, ...         | the types they speak; `DocumentReplica` keeps Yjs out of `.`   |
| `./react`     | `usePresence`, `useCursors`, `useSharedDocument`, `yjsReplica`                          | the hooks and the Yjs binding                                  |
| `./testing`   | `MemoryPresenceChannelDriver`, `MemorySyncTransportDriver`, `MemorySnapshotStoreDriver` | in-process drivers for tests                                   |
| `./contracts` | `MentionDirectory`, `CommentVisibility`, `MentionKind`, `ThreadStatus`                  | the mention port the consumer binds; the comment enums         |
| `./contracts` | `CommentableRef`, `MentionTarget`, `CommentRules`, `CommentView`                        | the comment types                                              |
| `.`           | `CommentCreated`, `MentionCreated`, `checkMentions`, three refusals                     | events, the mention floors, `comment_tombstoned` and others    |
| `./node`      | `CommentThread`, `Comment`, `CommentRevision`, `CommentMention`, `CommentService`       | the tables (`collaboration.0002_create_comments`) and service  |
| `./testing`   | `MemoryMentionDirectoryDriver`                                                          | a fixed set of known mention targets                           |
| `./node`      | `RoomPublishAction`, `RoomPublishInput`                                                 | `collaboration.room.publish`: a stream member's messages       |

## Comments

```ts
const comment = await comments.post(
  ctx.scope,
  { record: { model: "legal.matter", id }, body, visibility, mentions, isExternalAuthor },
  actor.id,
  { sharedComments: settings.sharedComments, assistantHandle: settings.assistantHandle }, // tenant settings
);
await comments.edit(comment.id, body, mentions, actor.id, rules); // keeps a revision, announces added mentions only
await comments.tombstone(comment.id, actor.id); // text hidden, mentions dropped; refused under a legal hold
await comments.resolveThread(comment.threadId, actor.id); // a reply reopens it
```

The floors are code: an external author never posts internal, an external participant is never mentioned on an
internal comment, the assistant is not mentioned while it has no handle, a tombstone shows no text. Defaults (the level
a comment takes, whether sharing is open, the handle) are the consumer's settings; who may edit or delete is its
policy.

## Collaboration levels

ADR 0270 decision 6 sets the level per document kind:

| Level          | Kinds                                       | Use                                         |
| -------------- | ------------------------------------------- | ------------------------------------------- |
| full           | page, screen, app shell, post, article      | `useSharedDocument` + `useCursors`          |
| presence + OCC | form, dashboard, email template, automation | `usePresence`; saves keep the version check |
| OCC            | navigation, pricing rules                   | nothing from this package                   |

```tsx
const room = { document: page.id, scope };
const doc = useSharedDocument(room); // a Y.Doc: restored, co-edited, autosaved
const presence = usePresence(room); // { status, peers }
const [cursors, moveCursor] = useCursors(room);
```

A room is keyed by its document's public id and scoped by a `ScopeRef`. The grant of `LiveCollaborationEntitlement`
is read for that scope when the room is first held. Without it, `usePresence` throws `EntitlementRequiredError` to the
nearest error boundary, and `useSharedDocument` still restores and saves the document, alone: editing and snapshots are
never gated.

## Snapshots

`SnapshotService.track` saves the full state at most once per `snapshotIntervalSeconds` after a local change, and once
more when the editor closes. Only the client that made a change saves it. Autosave starts only after the restore
succeeded, so a failed load never overwrites the saved state. Retention is the `SnapshotStore` driver's: keeping the
latest is enough, because versions, drafts and publishing are the content type's (ADR 0270 decision 2).

## Not a sync engine

Yjs is the CRDT for shared documents only. A `SyncTransport` relays live updates of one open document; on every open
the replica sends its full state, so a reconnect converges. There is no offline queue and no record sync (ADR 0227).

## Testing

```ts
const presence = MemoryPresenceChannelDriver.for("usr_…");
const sync = new MemorySyncTransportDriver();
const session = new CollaborationSession(
  config,
  presence,
  sync,
  fakeEntitlements([[LiveCollaborationEntitlement, true]]),
);
const other = new CollaborationSession(config, presence.peer("usr_…"), sync.peer(), source);
presence.drop(); // the link goes down; presence.reconnect() brings it back
```

## Network drivers

- `RealtimePresenceChannelDriver` and `RealtimeSyncTransportDriver` (`.`) ride the document's `@stackra/realtime` room
  (ADR 0346). Before each connect they ask the `RoomTokens` port (`./contracts`) for a one-time token; the host binds it
  over its generated client's room-token action. Presence is re-announced every `presenceHeartbeatSeconds`, cursors
  are throttled to `cursorIntervalMilliseconds`, and updates travel as base64 `update` messages.
- When the room's socket closes before it ever opened (a proxy or network that blocks WebSockets), the link streams
  the room over server-sent events (`GET REALTIME_ROOM_PATH`, served by `RealtimeRooms.stream`) for the rest of its
  life and sends through `RoomTokens.publish` with the publish key of its `welcome`. The host overrides `publish` over
  its generated client's `collaboration.room.publish`; the default rejects, so such a link only listens.
- `RoomPublishAction` (`./node`, `collaboration.room.publish@1`, users only, not a tool) relays one message as the
  member whose key it is (`RealtimeRooms.publishFrom`), only for that member's own principal and with the checks a
  socket message gets: a viewer's `update` is refused `forbidden`, the size and rate caps drop the member. The service
  that serves rooms hosts it. Its permission is `collaboration.room.publish` (`RoomPermissions`, L1).
- `PostgresSnapshotStoreDriver` (`./node`) keeps the latest state per document in `collaboration.snapshots`
  (migration `collaboration.0001_create_snapshots`), isolated by the room's scope.

## Limits today

- A stream member's publish that reaches another instance is fire-and-forget: a refusal arrives on the member's own
  stream as a `refused` frame, not as the action's answer.
- Gen still routes only the WebSocket to `REALTIME_ROOM_PATH`; the raw endpoint must call `rooms.stream(request)` for a
  plain GET before the fallback works end to end.
