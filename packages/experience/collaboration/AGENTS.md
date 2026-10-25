# AGENTS — @stackra/collaboration

Presence, cursors, the Yjs binding and snapshots. Member at `packages/experience/collaboration` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                | It goes in…                                    |
| ------------------------------- | ---------------------------------------------- |
| A port or a type it speaks      | `src/contracts/{ports,types}/`                 |
| The configuration               | `src/config/collaboration.config.ts`           |
| The entitlement                 | `src/core/access/`                             |
| The session or snapshot service | `src/core/services/`                           |
| React code or the Yjs binding   | `src/react/<name>/`                            |
| A memory driver                 | `src/testing/drivers/`                         |
| A test                          | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- Yjs is imported only in `src/react/shared-document/`; `.` and `./contracts` stay CRDT-free behind `DocumentReplica`.
- `LiveCollaborationEntitlement` gates presence, cursors and co-editing, never editing or snapshots.
- A peer's principal is stamped by the server driver; never accept one from a client.
- No offline queue, no record sync (ADR 0227): resend the full state on every open instead.
- No tenant vocabulary: a room is a document `PublicId` and a `ScopeRef` (R-59).
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                 | Where               | Handling                                                            |
| -------------------- | ------------------- | ------------------------------------------------------------------- |
| Principal public ids | presence peers      | Ids only, in memory for the life of a room. Not stored.             |
| Cursor positions     | presence peers      | Ephemeral; never stored.                                            |
| Document content     | replicas, snapshots | Stored by the host's `SnapshotStore` driver under the room's scope. |
