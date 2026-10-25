# Feature Specification: `@stackra/collaboration` wave 4: presence, cursors, the Yjs binding and snapshots

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/collaboration` (experience, a new package) for real: presence, cursors, a Yjs binding and
snapshots, free code gated by an entitlement (ADR 0270 decision 5, ADR 0225 RT2, ADR 0202).

## Impact

- **Apps touched**: none. The template imports nothing from this package yet; the builder kernel will
- **Services touched**: none
- **Packages touched**: `packages/experience/collaboration` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables and no tenant vocabulary (R-59): a room is a document `PublicId` scoped by the
  contracts `ScopeRef`; presence holds principal public ids in memory only; document state is stored by the host's
  `SnapshotStore` driver
- **Secrets**: none
- **ADR needed**: no (ADR 0225 RT2, 0270 decisions 5 and 6, 0202, 0215, 0227, 0294, 0305, the ADR 0127 2026-10-24
  note); the realtime room channel the network drivers need is an open item for a later ADR
- **New dependencies**: `yjs` 13.6.33 (MIT, published 2026-09-23) through `catalog:` as an optional peer and a dev
  dependency, pending the catalog pin; workspace packages through `workspace:*`; `zod` through `catalog:`; `react`
  through `catalog:frontend` as an optional peer; `jsdom` and `@testing-library/*` (tests only) through
  `catalog:frontend`
- **Deploy modes**: same in all; the package opens no network itself (the host binds the three ports)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177); live collaboration is
  unlocked per scope by `LiveCollaborationEntitlement`
- **Docs to update**: `packages/experience/collaboration/README.md`, `packages/experience/collaboration/AGENTS.md`;
  ADR 0225, 0270 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (an entitlement gate on a client surface; a mistake shows presence to an unentitled plan, never
  another scope's data)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24. The choices made when it was
specified:

- Registry v3.1 row: presence, cursors, the Yjs binding and snapshots; free, entitlement-gated; entries "tbd";
  depends on realtime
- Launcher brief: entries `.`, `./contracts`, `./react`, `./testing`; ports for the sync transport, the snapshot store
  and the presence channel; Yjs behind a `./contracts` seam so `.` loads no CRDT library; `CollaborationConfig` with
  `CollaborationConfig$`
- Owner, R-59: no tenant vocabulary; rooms are scoped by `ScopeRef`
- Builder, recorded for review: `@stackra/realtime` delivers data-free, server-to-client refreshes only (ADR 0225,
  note of 0294), so presence, cursors and document updates cannot ride its channels today; the package defines
  `PresenceChannel` and `SyncTransport` ports whose network drivers come with a payload-carrying room channel, and
  reuses realtime's `RealtimeStatus` for the room status
- Builder, recorded for review: presence and the document stream are two ports because ADR 0270 decision 6 gives
  structured documents presence without co-editing
- Builder, recorded for review: the entitlement gates presence, cursors and co-editing only; a document still opens,
  restores and saves without it; ADR 0270 sets no snapshot retention, so retention is the store driver's (versions are
  the content type's, ADR 0270 decision 2)

## User Scenarios & Testing

### User Story 1 - See who else is editing (Priority: P1)

An editor of a form or a page shows the other people in the document; they appear and disappear live.

**Independent Test**: `src/core/services/__tests__/collaboration-session.service.test.ts`,
`src/react/presence/__tests__/use-presence.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a granted plan, **When** two principals hold the same room, **Then** each sees the other, and the status
   is `connected`.
2. **When** the last holder releases the room, **Then** the other peer's list empties.
3. **Given** a lost link, **Then** the peers empty and the status is `disconnected`; on reconnect they return.
4. **Given** a plan without live collaboration, **Then** the room records `EntitlementRequiredError` and
   `usePresence` throws it to the nearest error boundary.

### User Story 2 - Share pointers on a canvas (Priority: P1)

**Independent Test**: `src/react/cursors/__tests__/use-cursors.test.tsx`,
`src/core/services/__tests__/collaboration-session.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** rapid pointer moves, **Then** the first is sent at once and the latest after `cursorIntervalMilliseconds`.
2. **Then** `useCursors` lists only the peers with a cursor and moving to `null` hides this client's.

### User Story 3 - Co-edit a long document and keep it (Priority: P1)

**Independent Test**: `src/react/shared-document/__tests__/use-shared-document.test.tsx`,
`src/core/services/__tests__/snapshot.service.test.ts`,
`src/react/shared-document/__tests__/yjs-replica.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a saved snapshot, **When** the editor opens, **Then** its `Y.Doc` holds the saved state.
2. **When** two replicas edit, **Then** each sees the other's change, and after a reconnect they converge.
3. **When** the editor closes, **Then** unsaved local changes are saved; while it changes, at most one snapshot per
   `snapshotIntervalSeconds` is saved.
4. **Given** a failed restore, **Then** the hook throws to the error boundary and nothing is saved.
5. **Given** a plan without live collaboration, **Then** the document still restores and saves, without syncing.

### User Story 4 - Test collaboration without a network (Priority: P2)

**Independent Test**: the three tests in `src/testing/drivers/__tests__/`.

**Acceptance Scenarios**:

1. **Given** `new MemoryPresenceChannelDriver(alice)` and `.peer(bob)`, **Then** the two share rooms; `drop()` and
   `reconnect()` take one side down and up.

## Requirements

- **FR-001**: Four entries, `.`, `./contracts`, `./react`, `./testing` (ADR 0294 decision 15); `./contracts` imports
  no other entry and no CRDT library.
- **FR-002**: `.` exports `CollaborationConfig`, `CollaborationConfig$`, `CollaborationOptions`,
  `LiveCollaborationEntitlement`, `CollaborationSession`, `SnapshotService` and the type `CollaborationRoomState`, and
  loads no Yjs.
- **FR-003**: `./contracts` exports the `PresenceChannel`, `SyncTransport` and `SnapshotStore` ports and their types;
  `./react` exports `usePresence`, `useCursors`, `useSharedDocument` and `yjsReplica`; `./testing` exports the three
  memory drivers.
- **FR-004**: A room is joined only after the `LiveCollaborationEntitlement` grant for its scope is `true`; a refusal
  is recorded in the room's state and nothing is joined or synced; editing and snapshots are never gated.
- **FR-005**: A bound replica sends its full state on every stream open and streams local changes only, so updates
  never echo and a reconnect converges with no offline queue (ADR 0227).
- **FR-006**: Snapshots are saved only from local changes, at most once per interval, and on stop; autosave starts
  only after a successful restore.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test beside it; the barrel tests pin each entry's exports; tests run in the
  separate testing workflow (owner mode, 2026-10-24: not run here).
- **SC-003**: Format, lint and the repository validator pass on the member (typecheck and build after the
  integrator's install).

## Open items (for the owner, not blocking)

- Network drivers for `PresenceChannel` and `SyncTransport`: `@stackra/realtime` needs a payload-carrying, two-way room
  channel (authorised per room, principal stamped by the server); an ADR decides whether that extends ADR 0225 or the
  typed module streams of R-25.
- A `SnapshotStore` driver belongs to the document's owner (the content service).
- `yjs` 13.6.33 must be pinned in the default catalog before install.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · wave 4 of the STA-348 framework build (owner mode 2026-10-24: develop now, test later)
