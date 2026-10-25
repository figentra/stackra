# @stackra/collaboration

Stackra collaboration: presence, cursors, the Yjs binding and snapshots for the builder's documents. The code is free;
live collaboration is unlocked per scope by `LiveCollaborationEntitlement` (ADR 0270 decision 5, ADR 0202).

**Tier:** `tier:lib` (`packages/experience/collaboration`). Entries `.`, `./contracts`, `./react` and `./testing`.
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/errors`,
`@stackra/entitlements`, `@stackra/realtime` and zod. React and Yjs are optional peers for `./react`.

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
const presence = new MemoryPresenceChannelDriver("usr_…");
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

## Limits today

- No network driver ships for `PresenceChannel` or `SyncTransport`. `@stackra/realtime` delivers data-free refreshes
  from the server only, so presence, cursors and document updates cannot ride its channels yet; the drivers come
  with a payload-carrying, two-way room channel in realtime (needs an ADR). The host binds its own drivers until then.
- No `SnapshotStore` driver ships: the document's owner (the content service) implements it.
