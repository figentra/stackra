# AGENTS — @stackra/collaboration

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/collaboration.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0346; ADR 0294; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

Presence, cursors, the Yjs binding and snapshots. Member at `packages/experience/collaboration` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                | It goes in…                                      |
| ------------------------------- | ------------------------------------------------ |
| A port or a type it speaks      | `src/contracts/{ports,types}/`                   |
| The configuration               | `src/config/collaboration.config.ts`             |
| The entitlement                 | `src/core/access/`                               |
| The session or snapshot service | `src/core/services/`                             |
| React code or the Yjs binding   | `src/react/<name>/`                              |
| A memory driver                 | `src/testing/drivers/`                           |
| A network driver over realtime  | `src/core/drivers/`, helpers in `core/functions` |
| A server driver or migration    | `src/node/{drivers,database/migrations}/`        |
| A server action and its input   | `src/node/{actions,schemas}/`                    |
| A server permission             | `src/node/access/<model>.permissions.ts`         |
| A test                          | `__tests__/<name>.<kind>.test.ts(x)` beside it   |

## This package

- `openRoom` reconnects through the contracts `backoffDelay` (500 ms doubling, equal jitter, up to realtime's
  `maxBackoff`); never inline a backoff formula (stackra-223).
- Yjs is imported only in `src/react/shared-document/`; `.` and `./contracts` stay CRDT-free behind `DocumentReplica`.
- `LiveCollaborationEntitlement` gates presence, cursors and co-editing, never editing or snapshots.
- A peer's principal is stamped by the server driver; never accept one from a client.
- The room publish action (`collaboration.room.publish`, `src/node/actions/`) passes the call's subject to
  `RealtimeRooms.publishFrom`; never a principal from the input. A publish key is the membership's secret: never log it.
  Its permission is `RoomPermissions.publish` (L1), read by key.
- `openRoom` falls back to the event stream only when the socket closed unopened, and stays on it for the link's life.
- No offline queue, no record sync (ADR 0227): resend the full state on every open instead.
- No tenant vocabulary: a room is a document `PublicId` and a `ScopeRef` (R-59).
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                 | Where                                         | Handling                                                                    |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Principal public ids | presence peers                                | Ids only, in memory for the life of a room. Not stored.                     |
| Cursor positions     | presence peers                                | Ephemeral; never stored.                                                    |
| Document content     | replicas, snapshots                           | Stored by the host's `SnapshotStore` driver under the room's scope.         |
| Comment text         | `collaboration.comments`, `comment_revisions` | Under the scope policy; never in an event or a log; hidden once tombstoned. |
| Mention targets      | `collaboration.comment_mentions`, events      | Ids and kinds only.                                                         |
