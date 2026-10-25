# Feature Specification: `@stackra/builder` wave 7: the editor kernel for every builder document kind

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/builder` (experience, a new package) for real: the one editor kernel every builder document
kind runs on (ADR 0270 decision 4), with no UI chrome. It holds a document model of block instances with props, the
insert, move, remove and set-prop commands with undo and redo, the selection, a check against the registered blocks,
serialisation to the experience document shape, the co-edit binding through `@stackra/collaboration`, and the React
hooks.

## Impact

- **Apps touched**: none. The template imports nothing from this package; the console's studio builders will
- **Services touched**: none
- **Packages touched**: `packages/experience/builder` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables and no tenant vocabulary (R-59); a room is collaboration's `CollaborationRoom`
  (document `PublicId` plus `ScopeRef`); documents are saved by the content type and the snapshot store
- **Secrets**: none
- **ADR needed**: no (ADR 0270, 0114, 0154, 0110, 0294, 0305, 0328); the two-way collaboration room channel is ADR 0346
  (planned)
- **New dependencies**: none new to the repository: workspace packages through `workspace:*`; `react`
  (`catalog:frontend`) and `yjs` (`catalog:`, already pinned) as optional peers; `zod`, `jsdom` and
  `@testing-library/*` for tests only
- **Deploy modes**: same in all; the package opens no network itself
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177); each editor kind is
  unlocked by an app entitlement in the studio (ADR 0202, 0270 decision 9), and live co-editing by collaboration's
  `LiveCollaborationEntitlement`
- **Docs to update**: `packages/experience/builder/README.md`, `packages/experience/builder/AGENTS.md`; ADR 0270 is
  cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (a new public contract the studio editors build on; a mistake loses an edit, never another
  scope's data)

## Clarifications

### Session 2026-10-25

The package follows the v3.1 registry row and the owner decisions of 2026-10-24. The choices made when it was
specified:

- Registry v3.1 row: "Editor kernel for every builder document kind (0270)"; entries tbd; no template exports; depends
  on experience and collaboration
- Launcher brief: entries by what has files among `.`, `./contracts`, `./react`, `./native`; kernel = document model,
  commands with undo and redo, selection, schema check against experience's registry, serialisation to the experience
  document shape, a collaboration binding through `@stackra/collaboration`, `useEditor` and `useSelection` with no UI
  chrome; the live room channel (ADR 0346) is not built yet
- Builder, recorded for review: the hooks touch no DOM, so React Native imports them from `./react` and there is no
  `./native` entry (one symbol, one entry; theming and collaboration do the same)
- Builder, recorded for review: experience's `DocumentNode` has no id, so an `EditorNode` is a `DocumentNode` with an id
  and with props and children always present; a stored node without an id gets `b<n>` (its depth-first position), so
  every editor derives the same ids for the same document and identical co-edit seeds merge as one
- Builder, recorded for review: experience keeps its block registry private so far, so `EditorOptions.blocks` is a map
  of block key to block class; props are checked with `@stackra/validation`'s `validate` against each block's generated
  schema
- Builder, recorded for review: props are checked on demand (`problems()`), not on every edit, because a block is
  incomplete while it is being filled in; `insert` refuses an unregistered key at once
- Builder, recorded for review: `useSharedEditor` drives `CollaborationSession.bind` and `SnapshotService` itself rather
  than `useSharedDocument`, so the editor seeds an empty shared document only after the restore

## User Scenarios & Testing

### User Story 1 - Edit a document with undo (Priority: P1)

A studio builder opens a page, inserts, moves, removes and fills blocks, and undoes and redoes its changes.

**Independent Test**: `src/core/values/__tests__/editor.value.test.ts`,
`src/core/functions/__tests__/apply-change.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** an open document, **When** a registered block is inserted, **Then** it appears with a new id and the change
   can be undone; an unregistered key is refused with `BlockNotRegisteredError`.
2. **When** changes are undone and redone, **Then** the tree returns to each earlier state exactly; a new change clears
   the redo stack; at most 200 steps are kept.
3. **Given** a move into the block's own subtree, or a move or removal of the root, **Then** it is refused before
   anything changes.

### User Story 2 - Select and inspect (Priority: P1)

**Independent Test**: `src/core/values/__tests__/editor.value.test.ts`,
`src/react/selection/__tests__/use-selection.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a selection, **When** a selected block is removed, **Then** it leaves the selection.
2. **Then** `useSelection` re-renders when the selection changes and not on other edits.

### User Story 3 - Check a document before publishing (Priority: P1)

**Independent Test**: `src/core/values/__tests__/editor.value.test.ts`,
`src/core/functions/__tests__/parse-document-node.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a block whose key is not registered or whose props break its schema, **Then** `problems()` names it by
   `<id>` or `<id>.<prop path>`.
2. **Given** a stored tree that is malformed, too deep or too large, **Then** opening it refuses with
   `DocumentInvalidError` and every problem by path.

### User Story 4 - Co-edit a page (Priority: P2)

**Independent Test**: `src/react/shared-editor/__tests__/bind-shared-document.function.test.ts`,
`src/react/shared-editor/__tests__/use-shared-editor.test.tsx`.

**Acceptance Scenarios**:

1. **Given** two editors of one room, **When** either changes the document, **Then** the other shows it, not as an
   undoable step; two people setting different props of one block both keep theirs.
2. **Given** a saved snapshot, **Then** the editor opens on the saved tree; with none, it seeds the document from the
   draft after the restore, and identical seeds merge as one.
3. **Given** a failed restore, **Then** the hook throws to the error boundary and nothing is saved.

## Requirements

- **FR-001**: Three entries, `.`, `./contracts`, `./react` (ADR 0294 decision 15); `./contracts` imports no other
  entry; `.` loads neither React nor Yjs.
- **FR-002**: `Editor` changes a document only through insert, move, remove and set-prop, each undoable, with redo, a
  200-step bound and steps a co-editor made impossible skipped.
- **FR-003**: The selection holds only blocks in the tree and keeps its identity while unchanged.
- **FR-004**: `insert` refuses an unregistered block key; `problems()` reports every unregistered key and every prop
  that breaks its block's schema, by path.
- **FR-005**: `parseDocumentNode` is the trust boundary for document structure (format, unique ids, 32 levels, 10,000
  blocks) and the editor's tree is the experience document shape with ids.
- **FR-006**: `bindSharedDocument` and `useSharedEditor` keep an editor and the room's Yjs document in step through
  `@stackra/collaboration`, seed only after the restore, and never echo or make undoable a remote change.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test beside it; the barrel tests pin each entry's exports; tests run in the
  separate testing workflow (owner mode, 2026-10-24: not run here).
- **SC-003**: Format, lint and the repository validator pass on the member (typecheck and build after the
  integrator's install).

## Open items (for the owner, not blocking)

- The live room channel that carries Yjs updates and presence between browsers (ADR 0346, planned); until then the
  `SyncTransport` and `PresenceChannel` drivers are the host's.
- `@stackra/experience` could add an optional `id` to `DocumentNode` and must keep accepting it on render; and could
  export its registered blocks so `EditorOptions.blocks` reads from there.
- A document stored as a list of nodes is opened under one root block by its owner; the kernel edits one root.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · wave 7 of the STA-348 framework build (owner mode 2026-10-24: develop now, test later)
