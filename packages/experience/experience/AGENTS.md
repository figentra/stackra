<!-- Stackra file contract: Purpose: the agent guide to @stackra/experience. Boundary: this package only. Runtime: docs. Governing contract: ADR 0110; ADR 0270; ADR 0440. -->

# AGENTS — @stackra/experience

The `Block` kind, `LocalizedText`, the L2 document format and validator, the `Renderer` port, the web and native
`DocumentRenderer`, the edge HTML render and the node renderer of email templates and print documents. Member at `packages/experience/experience` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./edge`, `./server`, `./react`, `./native`.

## Where code goes

| You are writing…              | It goes in…                                    |
| ----------------------------- | ---------------------------------------------- |
| The document format, the port | `src/contracts/types/`, `src/contracts/ports/` |
| The kind base (`Block`)       | `src/core/bases/block.base.ts`                 |
| The validator, the registry   | `src/core/functions/`                          |
| A refusal                     | `src/core/errors/`                             |
| Web drawing                   | `src/react/<name>/`, `src/react/drivers/`      |
| Native drawing                | `src/native/<name>/`, `src/native/drivers/`    |
| Edge HTML (the Worker)        | `src/edge/<group>/`                            |
| Node HTML, email, PDF         | `src/server/<group>/`                          |
| A test                        | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- A document holds data that references registered code only: no markup, CSS, script, expression or URL to code
  (ADR 0110 decision 4, ADR 0154). Never evaluate a prop.
- Keys are derived by gen; never add a `key` option to `Block`. The icon is an `IconName` written as a generated
  constant (R-56).
- `resolveDocument` checks the whole tree before a driver draws anything; drivers never draw an unchecked node.
- `validateDocument` is the server-side check: it needs no component and never throws on the document, which is
  untrusted. A block fits only the `ExperienceKind`s it declares (a page and a screen by default).
- Theme revisions are append-only: a rollback is a new revision, never an edit or a removal.
- `./contracts` stays a leaf: the builder and collaboration read `DocumentNode` from it without a renderer.
- `BLOCK_ENTRIES` stays internal; the only way out is `registeredBlocks()`, a copy without the components.
- The web and native drawings are separate code on `@stackra/ui` and `@stackra/ui/native` (ADR 0112 X9); keep them in
  step.
- `BlockProps` in `.` and in `./native` are two declarations: the native one adds a required `onEvent` (registry A3).
- `./edge` runs in the OS edge Worker: no React, no Node API, no fetch, no global state. It renders only the
  `EdgeBlock`s the OS passes; any other key (a product's block) and a block that `accepts` a query become a placeholder
  the shell hydrates. It never throws: a failure or a budget overrun returns `ok: false` with the revision and the
  Worker serves the shell (ADR 0440). An edge block escapes every prop with `escapeHtml`.
- `./server` is the node renderer of `email_template` and `print_document` documents: it runs `validateDocument`
  against the kind and throws (`UnknownBlockError`, `InvalidDocumentError`) before drawing, never draws a placeholder,
  never runs a query (the host passes `data`), and prints through `@stackra/documents/contracts` `PdfEngine` only
  (never documents' `.`). A server block escapes every prop and data value with `escapeHtml`.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/` or `./testing`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

Documents are tenant content and may hold personal text a tenant wrote; this package renders it and stores nothing.
A refusal names a key and a path, never a prop's value.
