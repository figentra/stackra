# Plan: `@stackra/builder` wave 7

**Spec**: `.agents/specs/sta-348-builder/spec.md`

## Design

- Contracts (`src/contracts/`): `EditorNode` extends experience's `DocumentNode` with `id` and with `props` and
  `children` required; `EditorChangeKind` (`insert`, `remove`, `move`, `set_prop`) and the `EditorChange` union;
  `EditorState` (`root`, `selection`, `canUndo`, `canRedo`); `EditorOptions` (`root: DocumentNode`, `blocks`: block key
  to block class).
- `parseDocumentNode(input)` (`src/core/functions/`): the wire form; validates each node (`BLOCK_KEY_PATTERN`,
  `BLOCK_ID_PATTERN`, plain-object props, children array), defaults absent props and children, derives `b<n>` for an
  absent id, keeps `input`, drops other keys, bounds the tree by `MAX_DOCUMENT_DEPTH` (32) and `MAX_DOCUMENT_BLOCKS`
  (10,000), freezes it, and refuses with `DocumentInvalidError` and field errors by path.
- `applyChange(root, change)` (internal): pure path-copying over frozen trees, indexes clamped, returning the new tree
  and the inverse change; refuses with `BlockNotFoundError`, `RootBlockLockedError`, `BlockMoveInvalidError` or
  `DocumentInvalidError` (`id_taken`).
- `Editor` (`src/core/values/`, built with `Editor.create`): applies a local change, pushes its inverse (200 kept),
  clears redo, commits a frozen state (selection pruned, identity kept when unchanged) and reports the change through
  `onChange`; `undo` and `redo` skip a step whose refusal shows a co-editor changed the tree; `replace` swaps the tree
  without an undo step or a report; `problems()` validates each block's props with `validate(blockClass, props)` and
  reports unregistered keys.
- `./react`: `useEditor` (one editor per mount, `useSyncExternalStore` on its state, returns `[state, editor]`);
  `useSelection` (the selection only); `bindSharedDocument(editor, doc)` (the Yjs layout `blocks` map of id to
  `{ block, props: Y.Map, children: Y.Array, input }` plus `builder.root`; seeds an empty document with a client id
  hashed from the tree so identical seeds merge; mirrors local changes under a private origin; replaces the editor's tree
  on remote updates, reading only what `parseDocumentNode` accepts); `useSharedEditor(room, options)` (its own `Y.Doc`,
  `CollaborationSession.bind`, `SnapshotService.restore`, then `track` and the binding, `undefined` until restored, a
  failed restore thrown during render).

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/builder`; workspace imports: `@stackra/collaboration`, `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/experience`, `@stackra/validation` (packages only) |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                   |
| Security                              | PASS   | stored and shared trees are bounded and format-checked before use; props are copied as own data (`__proto__` stays a key); a peer's bad block is hidden, never executed                                               |
| HTTP and events                       | N/A    | no action, endpoint or integration event                                                                                                                                                                              |
| Tenancy                               | PASS   | no tenant vocabulary (R-59): rooms are collaboration's `ScopeRef`-scoped `CollaborationRoom`                                                                                                                          |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                |
| Not built yet (ADR 0227)              | PASS   | Yjs for shared documents only, no sync engine; no tenant code in documents (ADR 0154)                                                                                                                                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                     |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                       |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; editor kinds are unlocked by app entitlements in the studio                                                                                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand; the room channel is ADR 0346 (planned)                                                                                                                |

- Boundaries: imports the six workspace packages above, React and Yjs only; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; one declaration per file; refusals end in `Error` with a typed `create`.
- Secrets and PII: document content in memory while open; saved by the content type and the snapshot store.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| SaaS       | a build-time library; co-editing over the host's collaboration drivers             |
| On-prem    | identical: the same build; the live grant comes from the verified licence          |
| Air-gapped | identical: needs no network at build; the live grant comes from the signed licence |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts` and `./react`, `src/contracts/` imports no other entry, and no file under `src/core/` imports `react` or `yjs` — Validates: FR-001
- **P-002**: for any sequence of applied changes, undoing all of them (within 200) restores the opened tree exactly, and redoing them restores the final tree — Validates: FR-002
- **P-003**: after any change, every selected id is in the tree, and an unchanged selection keeps its array — Validates: FR-003
- **P-004**: for any tree, `problems()` names every block whose key is not in `blocks` and every prop path its block's schema refuses, and `insert` never adds an unregistered key — Validates: FR-004
- **P-005**: for any input, `parseDocumentNode` either returns a frozen tree with unique ids within the bounds or refuses with `DocumentInvalidError`, and parsing the same input twice gives equal trees — Validates: FR-005
- **P-006**: for any interleaving of local changes on two bound editors and exchanges of their documents, both editors hold equal trees once both documents hold the same updates, and no remote change is reported through `onChange` — Validates: FR-006
