# @stackra/builder

## 0.1.0

### Minor Changes

- 791a8bd: Add the form document kind (`FormFieldType`, `FormDocument$`, `checkForm`, `formProblems`, `visibleFields`,
  `formAnswersSchema`, `FormInvalidError`) with `@stackra/rules` conditions, and the `DocumentEditor` kernel with
  `useDocumentEditor` and `automationProblems` for the automation and form editors (STA-843, STA-773, ADR 0426).
- b58ebce: Add the block inspector of ADR 0270 decision 4: `inspectorFieldsOf(schema)` turns a block's zod props schema into
  field descriptors (key, label, kind of text, number, boolean, enum, money or localized, required, options), and
  `useInspector(editor)` in `./react` returns the selected block's descriptors and values with a `set(key, value)` that
  goes through the editor's set-prop change, so undo works. `Editor` gains `blockClass(key)`, and `zod` moves from a dev
  dependency to a dependency.
- 8a6ae31: `Editor` takes an optional document `kind` and a reviewed `BlockKit`: `palette()` and `allows(key)` offer only the
  blocks that fit both, `insert` refuses others with `BlockNotAllowedError`, and `problems()` reports
  `block_not_allowed`, so form, email-template, print-document and partner theme-section surfaces share the kernel.
- 2787c1e: Add `@stackra/builder`, the one editor kernel for every builder document kind: block-instance documents, undoable insert, move, remove and set-prop changes, selection, a check against the registered blocks, and Yjs co-editing through `@stackra/collaboration`.
- 3da2dcc: Unique form names (STA-1383). The two form models are different things (a tenant-built form a respondent fills, and
  an admin resource form), so they keep separate shapes with separate names. Breaking renames:
  
  - `@stackra/builder`: the form document types `FormField` and `FormStep` are `FormDocumentField` and
    `FormDocumentStep` (its `visibleFields`, the respondent's conditional fields, keeps its name).
  - `@stackra/panel`: `visibleFields(fields, mode)` is `fieldsForMode(fields, mode)` (`FormField` and `FormStep`, the
    resource form builders, keep their names).

### Patch Changes

- 903c2a5: Node renderer of studio documents (STA-1019, batch stackra-29). experience: new `./server` entry, the node renderer of studio documents. `renderEmailTemplate` draws an email
  template (email-safe blocks only) to HTML and a plain-text part; `renderPrintDocument` draws a print document and
  prints it to PDF through `@stackra/documents`' `PdfEngine`; `renderServerHtml` is the shared page render. Each checks
  the document against its kind first and throws `UnknownBlockError` or `InvalidDocumentError` before drawing. New
  types `ServerBlock`, `ServerBlockContext`, `ServerRenderOptions`, `PrintRenderOptions`, `RenderedEmail`,
  `RenderedPrint`. New dependency `@stackra/documents` (`./contracts` only; no cycle). builder: docs only, pointing previews and sends at `@stackra/experience/server`.
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f7ae9dc]
- Updated dependencies [6579d24]
- Updated dependencies [2787c1e]
- Updated dependencies [6d0152d]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [e8ab3ca]
- Updated dependencies [2787c1e]
- Updated dependencies [903c2a5]
- Updated dependencies [a57a0df]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [9310c51]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f7a2d36]
- Updated dependencies [67aa168]
- Updated dependencies [0a96532]
- Updated dependencies [49c3553]
- Updated dependencies [c21a223]
- Updated dependencies [2787c1e]
- Updated dependencies [ca44233]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [ad2a950]
- Updated dependencies [fc44266]
- Updated dependencies [2787c1e]
- Updated dependencies [7441e28]
- Updated dependencies [eb2572b]
  - @stackra/collaboration@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/experience@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/workflow@0.1.0
  - @stackra/rules@0.1.0

Written by Changesets on release; never edited by hand.
