<!-- Stackra file contract: Purpose: the guide to @stackra/experience. Boundary: describes this package only. Runtime: docs. Governing contract: ADR 0110; ADR 0270; ADR 0440; ADR 0365. -->

# @stackra/experience

Stackra experience: the `Block` kind, `LocalizedText`, the L2 document format and its validator, the `Renderer` port,
the web and native `DocumentRenderer`, the edge render of a published document to HTML (`./edge`), and the node
renderer of email templates and print documents (`./server`, PDF through `@stackra/documents`). A block is
registered code (a props class and a component); a document is data that names block keys and their props, never
markup, CSS or logic (ADR 0110, 0154). The renderer resolves each key to the block registered on its target and
refuses an unknown one.

**Tier:** `tier:lib` (`packages/experience/experience`). Entries `.`, `./contracts`, `./edge`, `./server`, `./react`
and `./native`.
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/validation` (block schemas and
`@Renamed`), `@stackra/clients` (the queries blocks accept), `@stackra/i18n` (the locale), `@stackra/icons` (the
`IconName` type), `@stackra/ui` (the loading placeholder), `@stackra/documents` (the `PdfEngine` port, `./contracts`
only) and `zod`; React is an optional peer of `./react` and
`./native`.

## What is here

| Entry         | Symbol                                                                                                             | Use                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `.`           | `Block`, `BlockCategory`                                                                                           | the kind base: `class XBlock extends Block({ category, icon, accepts? }) {}`                                   |
| `.`           | `LocalizedText`                                                                                                    | a prop written once per locale (`{ en: "…", ar: "…" }`)                                                        |
| `.`           | `BlockProps`                                                                                                       | `Component<BlockProps<typeof XBlock>>`: the props as the visitor sees them                                     |
| `.`           | `registerBlocks`                                                                                                   | the generated wiring's call linking each block to its key and component                                        |
| `.`           | `registeredBlocks`                                                                                                 | a read-only copy of the registered block classes by key, for the builder                                       |
| `.`           | `resolveDocument`, `UnknownBlockError`, `InvalidDocumentError`                                                     | the document validator every renderer runs first, and its refusals                                             |
| `.`           | `validateDocument`, `blockKinds`                                                                                   | the server-side validator: every problem of a document against its kind                                        |
| `.`           | `commitTheme`, `rollbackTheme`, `diffTheme`, `validateTheme`                                                       | section-based themes with numbered revisions, rollback and a reviewed diff                                     |
| `.`           | `BlockClass`, `BlockOptions`, `BlockEntry`, `ResolvedNode`                                                         | types                                                                                                          |
| `.`           | `Theme`, `ThemeRevision`, `ThemeChange`, `ThemeDiff`, `ValidateDocumentOptions`                                    | types                                                                                                          |
| `./contracts` | `Renderer`                                                                                                         | the port; drivers `react` and `native`                                                                         |
| `./contracts` | `DocumentNode`, `BlockEvent`, `BlockEventHandlers`, `RenderContext`                                                | the document format, read by the builder and collaboration                                                     |
| `./contracts` | `ExperienceKind`, `DocumentProblem`                                                                                | the document kinds (page, screen, form, email template, print document, theme section) and a validator problem |
| `./edge`      | `renderEdgeDocument`, `EdgeRenderFailure`, `EDGE_RENDER_LIMITS`, `escapeHtml`                                      | the OS edge Worker's HTML render of a published document, its fallback codes and budget                        |
| `./edge`      | `EdgeBlock`, `EdgeBlockContext`, `EdgeRenderOptions`, `EdgeRenderResult`                                           | types                                                                                                          |
| `./server`    | `renderEmailTemplate`, `renderPrintDocument`, `renderServerHtml`, `escapeHtml`                                     | the node renderer: a studio email template to HTML and text, a print document to PDF through `PdfEngine`       |
| `./server`    | `ServerBlock`, `ServerBlockContext`, `ServerRenderOptions`, `PrintRenderOptions`, `RenderedEmail`, `RenderedPrint` | types                                                                                                          |
| `./react`     | `DocumentRenderer`, `ReactRendererDriver`                                                                          | `<DocumentRenderer document={page.root} />` on the web                                                         |
| `./native`    | `DocumentRenderer`, `NativeRendererDriver`, `BlockProps`                                                           | the same on a phone; native `BlockProps` adds `onEvent`                                                        |

## Declaring a block

```ts
// src/blocks/testimonials/testimonials.block.ts
export class TestimonialsBlock extends Block({
  category: BlockCategory.Content,
  icon: Icons.Quote,
  accepts: ListEntriesQuery,
}) {
  title!: LocalizedText;

  @Int({ min: 1, max: 12 })
  limit = 3;
}
```

The fields are the props a document may give the block; gen compiles them to one schema and the renderer checks
every node against it. The key (`web.testimonials`) is derived from the member and the folder, and the component is
`testimonials.tsx` (`testimonials.native.tsx` on native) beside it, bound by name. `@Renamed("web.quotes")` keeps an
old key resolving. `accepts` names a consumed query: the component receives its answer as `data`, fetched with the
node's `input`.

## Documents

```json
{
  "block": "web.section",
  "children": [
    {
      "block": "web.hero_section",
      "props": { "title": { "en": "Sell online", "ar": "بع عبر الإنترنت" } }
    },
    { "block": "web.testimonials", "props": { "limit": 3 }, "input": { "type": "testimonial" } }
  ]
}
```

A document is one node or a list. `resolveDocument` checks the whole tree before anything is drawn: a malformed node
throws `InvalidDocumentError`, a key nobody registered `UnknownBlockError`, props the schema refuses
`InvalidDocumentError` with the issues as its cause. In a block's props a string-keyed map of strings is a
`LocalizedText`: the renderer hands the component the visitor's string (exact tag, then language, then the first
locale stored), and `BlockProps` types it `string`.

## Document kinds and the server-side validator

A block names the kinds of document it fits: `Block({ category, icon, kinds: [ExperienceKind.EmailTemplate] })`. A
block that names none fits a page and a screen, so an email template or a print document only offers blocks that say
they are safe there (ADR 0270 decision 6).

```ts
import { ExperienceKind } from "@stackra/experience/contracts";
import { validateDocument } from "@stackra/experience";

const problems = validateDocument(body.root, { kind: ExperienceKind.EmailTemplate, blocks });
// [{ path: "0.children.1", code: "kind_not_allowed", block: "web.hero_section" }]
```

`validateDocument` runs where no component is loaded (the experience service, before a save or a publish). It never
throws on the document: it returns every problem in tree order, `invalid_node`, `unknown_block`, `kind_not_allowed`,
`invalid_props` (with the refused prop paths, never their values), `duplicate_id`, `too_deep` (over 32 levels) and
`too_many_blocks` (over 10,000), with tighter bounds if the caller passes them.

## Rendering on the server: email templates and print documents

A studio email template or print document is an L2 document of kind `email_template` or `print_document`. The node
renderer (`./server`, no React) draws it to one self-contained HTML page; an email gets a plain-text part, a print
document is printed to PDF through the `PdfEngine` the host bound (@stackra/documents, ADR 0365).

```ts
import { renderEmailTemplate, renderPrintDocument } from "@stackra/experience/server";

const { html, text } = renderEmailTemplate(template.root, {
  locale,
  direction, // the locale's setting: "ltr" | "rtl"
  blocks: MAIL_BLOCKS,
  data: { order, recipient },
  title: subject,
});

const { pdf } = await renderPrintDocument(layout.root, {
  locale,
  direction,
  blocks: PRINT_BLOCKS,
  data: { order },
  engine, // the bound PdfEngine
  page: { widthMm: 80, marginMm: 2 }, // a roll: no height
});
```

- **Checked first, then drawn.** The whole document goes through `validateDocument` against its kind: a key none of
  `blocks` has throws `UnknownBlockError`; a block that does not declare the kind (email-safe blocks only in an email
  template), refused props or an overrun of the size bounds throw `InvalidDocumentError`. Nothing is drawn and the
  engine is never called for a refused document.
- **Server blocks.** Each `ServerBlock` is a key, its block class and a pure `html(props, children, { locale, path,
data })` that writes every prop and data value through `escapeHtml`. Unlike the edge, there is no placeholder: an
  email or a PDF has no browser to hydrate one. A `@Renamed` old key still resolves.
- **Data, not queries.** The host resolves the render's values (the order, the recipient) into `data`; a node's
  `input` is ignored and no query runs. Images are `data:` URLs, so the engine fetches nothing.
- **Not here.** Sending (the `Mailer` driver or the notifications service), the email subject's storage, the
  `PdfEngine` driver and the studio preview wiring are the host's.

## Themes

A theme is named sections, each a theme-section document, and its settings as JSON. `commitTheme` appends a numbered,
frozen revision; `rollbackTheme(history, n, change)` appends a new revision with revision `n`'s content and
`restores: n`, so nothing is ever removed and a rollback can itself be rolled back; `diffTheme` names the section and
setting keys that changed, for the reviewed diff; `validateTheme` checks every section. The experience service stores
the history.

## Rendering

The generated wiring calls `registerBlocks([{ key, block, component }])` for the target and binds `Renderer` to
`ReactRendererDriver` (web) or `NativeRendererDriver` (iOS, Android). A page places
`<DocumentRenderer document={…} onNavigate={…} onAction={…} />`; the renderer comes from the container and the locale
from `@stackra/i18n`. A block raises a closed verb through `onEvent` (`{ verb: "navigate", route }` or
`{ verb: "action", key, input? }`), which reaches the page's `onNavigate` or `onAction`; a verb with no handler is
dropped. While a block's query loads a `@stackra/ui` Skeleton holds its place; a failed query draws nothing for that
block.

## Rendering at the edge

The OS edge Worker renders published landing and storefront pages to HTML for crawlers and first paint (ADR 0440). It
imports `./edge` only: no React, no Node API, no fetch.

```ts
import { renderEdgeDocument } from "@stackra/experience/edge";

const result = renderEdgeDocument(cached.root, {
  locale,
  revision: cached.revision,
  blocks: LANDING_EDGE_BLOCKS,
});
if (!result.ok) {
  log.warn("edge render fell back to the shell", {
    revision: result.revision,
    reason: result.reason,
    path: result.path,
  });
  return serveShell(request);
}
```

- **Only OS-registered blocks render.** `blocks` is the OS landing set, each an `EdgeBlock`: its key, its block class
  (whose generated schema parses the node's props) and a pure `html(props, children, { locale, path })` that writes
  every prop through `escapeHtml`. A `@Renamed` old key still resolves.
- **Everything else is a placeholder.** A product's own block, and a block that `accepts` a query, becomes
  `<div data-stackra-block="…" data-stackra-path="…" data-stackra-node="…">` with the stored node as escaped JSON; the
  shell hydrates it in the browser. No product code runs in the Worker.
- **Budget and fallback.** A render is bounded by depth, node count and HTML bytes (`EDGE_RENDER_LIMITS`: 32, 2,000,
  512 KiB; the Worker may pass its own `limits`). A Worker's clock stands still during synchronous work, so the CPU
  budget is counted in work, not time. A malformed document, refused props, a throwing block or an overrun never
  throws: the result is `ok: false` with an `EdgeRenderFailure` code, the node path and the document revision, and
  the Worker serves the shell. It is all or nothing, never half a page.
- The Worker caches the published document's data by host, path and revision, never the HTML (ADR 0297 decision 3).
