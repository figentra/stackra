# AGENTS — @stackra/builder

The editor kernel for every builder document kind (ADR 0270 decision 4). Member at `packages/experience/builder`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`.

## Where code goes

| You are writing…                        | It goes in…                                    |
| --------------------------------------- | ---------------------------------------------- |
| A type or the change-kind enum          | `src/contracts/{types,enums}/`                 |
| The editor                              | `src/core/values/editor.value.ts`              |
| A tree function (parse, apply a change) | `src/core/functions/`                          |
| A refusal                               | `src/core/errors/`                             |
| A bound or a format                     | `src/core/constants/`                          |
| A hook or the Yjs binding               | `src/react/<name>/`                            |
| A test                                  | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- `Editor` is the one way to change a document; `applyChange` stays internal. Every change is an `EditorChange`, so
  undo, redo and the Yjs binding see the same four kinds.
- Trees are frozen and replaced, never mutated: `editor.state` is a `useSyncExternalStore` snapshot.
- A document is data that names registered blocks (ADR 0154): no markup, CSS, script or expression, and no block a
  registry does not have. `parseDocumentNode` is the trust boundary for structure, and `problems()` for props.
- Yjs is imported only in `src/react/shared-editor/`. `.` and `./contracts` load no CRDT and no React.
- The shared reader keeps to what `parseDocumentNode` accepts, so a peer's bad block is hidden, never fatal.
- No UI chrome: surfaces, drag and drop, the inspector and publish live in the apps and the content type.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data             | Where                     | Handling                                                                |
| ---------------- | ------------------------- | ----------------------------------------------------------------------- |
| Document content | editor state, Yjs replica | In memory while open; saved by the content type and the snapshot store. |
