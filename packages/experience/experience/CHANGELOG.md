# @stackra/experience

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
- Updated dependencies [c4f295e]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/documents@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- e8ab3ca: Add document kinds (`ExperienceKind`: page, screen, form, email template, print document, theme section) with a
  `kinds` option on `Block` (a page and a screen by default) and `blockKinds`; the server-side `validateDocument`, which
  returns every problem of a document against its kind, the blocks and the depth and size bounds without throwing; and
  section-based themes with append-only revisions and rollback (`commitTheme`, `rollbackTheme`, `diffTheme`,
  `validateTheme`).
- 2787c1e: Add `@stackra/experience`: the `Block({ category, icon, accepts })` kind with `BlockCategory`, `LocalizedText` and
  `BlockProps`, the read-only `registeredBlocks()` the builder opens against, the L2 document format with its optional
  node `id` and its validator (`resolveDocument`, `UnknownBlockError`,
  `InvalidDocumentError`), the `Renderer` port, and the web and native `DocumentRenderer` with their `react` and `native`
  drivers.
- 903c2a5: Node renderer of studio documents (STA-1019, batch stackra-29). experience: new `./server` entry, the node renderer of studio documents. `renderEmailTemplate` draws an email
  template (email-safe blocks only) to HTML and a plain-text part; `renderPrintDocument` draws a print document and
  prints it to PDF through `@stackra/documents`' `PdfEngine`; `renderServerHtml` is the shared page render. Each checks
  the document against its kind first and throws `UnknownBlockError` or `InvalidDocumentError` before drawing. New
  types `ServerBlock`, `ServerBlockContext`, `ServerRenderOptions`, `PrintRenderOptions`, `RenderedEmail`,
  `RenderedPrint`. New dependency `@stackra/documents` (`./contracts` only; no cycle). builder: docs only, pointing previews and sends at `@stackra/experience/server`.
- a57a0df: Breaking rename (STA-1383): the section-based storefront theme is `SiteTheme`, so `Theme` means design tokens
  (`@stackra/tokens`) everywhere. `Theme`, `ThemeDiff`, `ThemeChange`, `ThemeRevision`, `commitTheme`, `diffTheme`,
  `rollbackTheme` and `validateTheme` of `@stackra/experience` are now `SiteTheme`, `SiteThemeDiff`, `SiteThemeChange`,
  `SiteThemeRevision`, `commitSiteTheme`, `diffSiteTheme`, `rollbackSiteTheme` and `validateSiteTheme`.
- 9310c51: One document-kind vocabulary and a unique block-node name (STA-1383).
  
  - `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
  - Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
    `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
  - Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
    `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
- 02ceb7e: One `LocalizedText`, in `@stackra/contracts` (a read-only record of strings per BCP 47 tag) (STA-1383). Breaking:
  `@stackra/experience` and `@stackra/brand-kit/contracts` no longer export their copies; import `LocalizedText` from
  `@stackra/contracts`. A brand kit's `name` and `line` are `LocalizedText & { readonly en: string }` (English still
  required).

### Patch Changes

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
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dfa0c6a]
- Updated dependencies [6da76a2]
- Updated dependencies [a45aec8]
- Updated dependencies [281ec71]
- Updated dependencies [830898b]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [0a38324]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [2787c1e]
- Updated dependencies [9fa447e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9ab18b4]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [1271b88]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/clients@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/documents@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
