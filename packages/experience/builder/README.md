# @stackra/builder

Stackra builder: the one editor kernel for every builder document kind (ADR 0270 decision 4). Pages, screens, forms,
dashboards, email templates, menus and automations are each a surface over the same kernel. The kernel holds the
document model, the four changes, undo and redo, the selection, the check against the registered blocks and the co-edit
binding. It renders no chrome: the apps' builders draw the canvas, tree and inspector. It is a package of its own, so a
render-only app never loads editor code.

**Tier:** `tier:lib` (`packages/experience/builder`). Entries `.`, `./contracts` and `./react`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/validation`, `@stackra/experience` (the
document format) and `@stackra/collaboration` (the session, snapshots and the Yjs replica). React and Yjs are optional
peers for `./react`.

## What is here

| Entry         | Symbol                                                                               | Use                                                                   |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `.`           | `Editor`                                                                             | one open document: changes, undo and redo, selection, `problems()`    |
| `.`           | `parseDocumentNode`                                                                  | a stored or received root node as a frozen editor tree, or a refusal  |
| `.`           | `MAX_DOCUMENT_DEPTH`, `MAX_DOCUMENT_BLOCKS`, `BLOCK_ID_PATTERN`, `BLOCK_KEY_PATTERN` | the bounds and formats a document keeps to                            |
| `.`           | `DocumentInvalidError`, `BlockNotRegisteredError`, `BlockNotFoundError`, ...         | the refusals                                                          |
| `./contracts` | `EditorNode`, `EditorChange`, `EditorChangeKind`, `EditorState`, `EditorOptions`     | the types; an `EditorNode` is an experience `DocumentNode` with an id |
| `./react`     | `useEditor`, `useSelection`                                                          | open a document, follow the selection (web and React Native)          |
| `./react`     | `useSharedEditor`, `bindSharedDocument`                                              | the same editor co-edited through `@stackra/collaboration` and Yjs    |

## The kernel

```ts
const editor = Editor.create({ root: page.root, blocks: registeredBlocks() }); // @stackra/experience
const hero = editor.insert(editor.state.root.id, 0, "web.hero_section");
editor.setProp(hero, "title", { "en-US": "Summer camp" });
editor.move(hero, sectionId, 0);
editor.select([hero]);
editor.undo();
editor.problems(); // { "<hero id>.title": "invalid_type" }
```

- A document is a tree of block instances. `editor.state.root` is the experience document as it stands, ids included,
  so saving needs no conversion: `id` is `DocumentNode`'s own optional field. A stored node without one gets `b<n>`,
  its position, when the document is opened.
- The only changes are insert, move, remove and set-prop. Each one is undoable, and the undo stack keeps 200 steps. A
  step whose block a co-editor removed is skipped.
- The palette is code (ADR 0270 decision 3). `insert` refuses a key that no registered block has.
  `problems()` checks every block's props against its generated schema, so a block may stay incomplete while it is
  being filled in, and publishing refuses what `problems()` reports.
- Documents are data that reference registered code only (ADR 0154). `parseDocumentNode` bounds a tree to 32 levels and
  10,000 blocks and drops every key outside `id`, `block`, `props`, `children` and `input`.

## Hooks

```tsx
const [state, editor] = useEditor({ root: page.root, blocks });
const selected = useSelection(editor); // re-renders on selection changes only
```

The hooks touch no DOM, so React Native builders import them from `./react` as well. There is no `./native` entry,
because one symbol lives in one entry. To open another document, remount with a `key`.

## Co-editing

ADR 0270 decision 6 gives full co-editing to pages, screens, app shells, posts and articles:

```tsx
const shared = useSharedEditor({ document: page.id, scope }, { root: page.root, blocks });
if (shared === undefined) return <CanvasSkeleton />; // restoring the saved state
const [state, editor] = shared;
```

`useSharedEditor` binds the editor to the room's Yjs document through `CollaborationSession.bind`. It restores the latest
snapshot first. Only then does it seed an empty document from the draft, so a stale draft never races the saved state.
It autosaves through `SnapshotService`. Each prop is its own Yjs entry, so two people who set different props of one
block both keep their change. Editors that seed the same draft at once write one identical update. Structured kinds
(forms, dashboards, menus) use `useEditor` with collaboration's `usePresence` and the content type's version check.

## Not yet

- The live room channel that carries Yjs updates between browsers is planned (ADR 0346). Until it lands, the
  `SyncTransport` driver is the host's.
- Surfaces (canvas, document, grid, tree, graph), drag and drop, the generated inspector, comments, preview and publish
  are the apps' and the content type's, built on this kernel.
