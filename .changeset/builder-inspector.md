---
"@stackra/builder": minor
---

Add the block inspector of ADR 0270 decision 4: `inspectorFieldsOf(schema)` turns a block's zod props schema into
field descriptors (key, label, kind of text, number, boolean, enum, money or localized, required, options), and
`useInspector(editor)` in `./react` returns the selected block's descriptors and values with a `set(key, value)` that
goes through the editor's set-prop change, so undo works. `Editor` gains `blockClass(key)`, and `zod` moves from a dev
dependency to a dependency.
