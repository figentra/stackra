# @stackra/builder

Stackra builder: the one editor kernel for every builder document kind (ADR 0270 decision 4). Pages, screens, forms,
dashboards, email templates, menus and automations are each a surface over the same kernel. The kernel holds the
document model, the four changes, undo and redo, the selection, the check against the registered blocks and the co-edit
binding. It renders no chrome: the apps' builders draw the canvas, tree and inspector. It is a package of its own, so a
render-only app never loads editor code.

**Tier:** `tier:lib` (`packages/experience/builder`). Entries `.`, `./contracts` and `./react`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/validation`, `@stackra/experience` (the
document format), `@stackra/collaboration` (the session, snapshots and the Yjs replica), `@stackra/rules` (form
conditions) and `@stackra/workflow` (the automation check). React and Yjs are optional
peers for `./react`.

## What is here

| Entry         | Symbol                                                                               | Use                                                                     |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `.`           | `Editor`                                                                             | one open document: changes, undo and redo, selection, `problems()`      |
| `.`           | `inspectorFieldsOf`                                                                  | a block's zod props schema as inspector field descriptors               |
| `.`           | `parseDocumentNode`                                                                  | a stored or received root node as a frozen editor tree, or a refusal    |
| `.`           | `MAX_DOCUMENT_DEPTH`, `MAX_DOCUMENT_BLOCKS`, `BLOCK_ID_PATTERN`, `BLOCK_KEY_PATTERN` | the bounds and formats a document keeps to                              |
| `.`           | `DocumentInvalidError`, `BlockNotRegisteredError`, `BlockNotAllowedError`, ...       | the refusals                                                            |
| `./contracts` | `EditorNode`, `EditorChange`, `EditorChangeKind`, `EditorState`, `EditorOptions`     | the types; an `EditorNode` is an experience `DocumentNode` with an id   |
| `./contracts` | `BlockKit`                                                                           | a reviewed block kit: the only blocks a surface may offer               |
| `./react`     | `useInspector`                                                                       | the selected block's fields, values and an undoable `set(key, value)`   |
| `./react`     | `useEditor`, `useSelection`                                                          | open a document, follow the selection (web and React Native)            |
| `./react`     | `useSharedEditor`, `bindSharedDocument`                                              | the same editor co-edited through `@stackra/collaboration` and Yjs      |
| `.`           | `DocumentEditor`, `automationProblems`                                               | the kernel of structured kinds: the automation editor's undo and check  |
| `.`           | `FormDocument$`, `checkForm`, `formProblems`, `FormInvalidError`                     | the form document kind and its write-time check                         |
| `.`           | `visibleFields`, `formAnswersSchema`                                                 | conditional steps and the answers' zod schema (submit, save and resume) |
| `./contracts` | `FormFieldType`, `DocumentEditorState`, `DocumentEditorOptions`                      | the form field types; the structured editor's state and options         |
| `./react`     | `useDocumentEditor`                                                                  | open an automation or a form in a `DocumentEditor`                      |

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

## Document kinds and reviewed kits

A form, an email template, a print document and a theme section are kinds of the same kernel (ADR 0270 decision 6):

```ts
const editor = Editor.create({
  root,
  blocks: registeredBlocks(),
  kind: ExperienceKind.EmailTemplate,
});
editor.palette(); // only the blocks whose `Block({ kinds })` names email_template
editor.insert(root.id, 0, "web.hero_section"); // throws BlockNotAllowedError
```

A partner theme's sections are edited with a reviewed `kit` (`{ key, blocks }`): the host builds it from the blocks
the app market approved and the first-party blocks it trusts, and the editor offers and inserts nothing outside it.
`problems()` reports `block_not_allowed` for a stored block the kind or kit does not allow, so publish refuses it;
`@stackra/experience`'s `validateDocument` makes the same check on the server.

## Hooks

```tsx
const [state, editor] = useEditor({ root: page.root, blocks });
const selected = useSelection(editor); // re-renders on selection changes only
```

The hooks touch no DOM, so React Native builders import them from `./react` as well. There is no `./native` entry,
because one symbol lives in one entry. To open another document, remount with a `key`.

## Inspector

```tsx
const { id, fields, values, set } = useInspector(editor); // follows the first selected block
```

`inspectorFieldsOf(schema)` describes each prop of a block's zod schema as `{ key, label, kind, required, options }`
with `kind` one of `text`, `number`, `boolean`, `enum`, `money` and `localized`; a prop of another shape (a list, a
nested object) is not offered. `set` goes through `editor.setProp`, so undo reverts it. The hook renders nothing: the
console draws the controls with `@stackra/ui`.

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

## Structured kinds: automations and forms

An automation (a trigger and a step list) and a form (steps of fields) are not block trees, so they open in a
`DocumentEditor`: the surface builds each next document whole, and the kernel keeps undo and redo and runs the kind's
check.

```tsx
const [state, editor] = useDocumentEditor({ document: automation, check: automationProblems });
editor.change({
  ...state.document,
  steps: [...state.document.steps, { name: "thank", block: "sms.send" }],
});
editor.problems(); // what AutomationService.draft would refuse, by path
```

The automation editor offers `@stackra/workflow`'s `buildingBlocks()`; `automationProblems` is its `checkAutomation`
without the throw.

## The form kind

A form is a document of `FormDocument$`: a key (`tenancy.onboarding`), a version, the action it submits to
(`forms.submit@1` by default) and 1 to 20 steps of 1 to 50 fields, each field a `FormFieldType`. A step or a field may
carry a `@stackra/rules` condition over `answers.<field>`: a step's over earlier steps, a field's over its own and
earlier steps. Money fields are not testable.

```ts
const form = checkForm(seed.document); // FormInvalidError with every problem by path
const answers = formAnswersSchema(form, ctx.now()).parse(input.answers); // submit
const draft = formAnswersSchema(form, ctx.now(), { partial: true }).parse(input.answers); // save and resume
```

`formAnswersSchema` checks each shown field by its type (`value_invalid`), requires the shown required ones
(`required`), and drops answers to hidden or unknown fields. Each product seeds its forms (onboarding among them) as
documents; the submission record and the renderer are the hosts'.

This kind closes OS tenancy G4 (stackra-139): a product's onboarding form is a `FormDocument$` seed checked with
`checkForm`, and the onboarding answers are its `formAnswersSchema` output.

## Not yet

- The live room channel that carries Yjs updates between browsers is planned (ADR 0346). Until it lands, the
  `SyncTransport` driver is the host's.
- Surfaces (canvas, document, grid, tree, graph), drag and drop, the generated inspector, comments, preview and publish
  are the apps' and the content type's, built on this kernel. The form renderer, the `forms.submit@1` action and the
  submission model are the experience service's.
