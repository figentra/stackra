# @stackra/experience

Stackra experience: the `Block` kind, `LocalizedText`, the L2 document format and its validator, the `Renderer` port,
and the web and native `DocumentRenderer`. A block is registered code (a props class and a component); a document is
data that names block keys and their props, never markup, CSS or logic (ADR 0110, 0154). The renderer resolves each
key to the block registered on its target and refuses an unknown one.

**Tier:** `tier:lib` (`packages/experience/experience`). Entries `.`, `./contracts`, `./react` and `./native`.
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/errors`, `@stackra/validation` (block schemas and
`@Renamed`), `@stackra/clients` (the queries blocks accept), `@stackra/i18n` (the locale), `@stackra/icons` (the
`IconName` type), `@stackra/ui` (the loading placeholder) and `zod`; React is an optional peer of `./react` and
`./native`.

## What is here

| Entry         | Symbol                                                                          | Use                                                                                                            |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `.`           | `Block`, `BlockCategory`                                                        | the kind base: `class XBlock extends Block({ category, icon, accepts? }) {}`                                   |
| `.`           | `LocalizedText`                                                                 | a prop written once per locale (`{ en: "…", ar: "…" }`)                                                        |
| `.`           | `BlockProps`                                                                    | `Component<BlockProps<typeof XBlock>>`: the props as the visitor sees them                                     |
| `.`           | `registerBlocks`                                                                | the generated wiring's call linking each block to its key and component                                        |
| `.`           | `registeredBlocks`                                                              | a read-only copy of the registered block classes by key, for the builder                                       |
| `.`           | `resolveDocument`, `UnknownBlockError`, `InvalidDocumentError`                  | the document validator every renderer runs first, and its refusals                                             |
| `.`           | `validateDocument`, `blockKinds`                                                | the server-side validator: every problem of a document against its kind                                        |
| `.`           | `commitTheme`, `rollbackTheme`, `diffTheme`, `validateTheme`                    | section-based themes with numbered revisions, rollback and a reviewed diff                                     |
| `.`           | `BlockClass`, `BlockOptions`, `BlockEntry`, `ResolvedNode`                      | types                                                                                                          |
| `.`           | `Theme`, `ThemeRevision`, `ThemeChange`, `ThemeDiff`, `ValidateDocumentOptions` | types                                                                                                          |
| `./contracts` | `Renderer`                                                                      | the port; drivers `react` and `native`                                                                         |
| `./contracts` | `DocumentNode`, `BlockEvent`, `BlockEventHandlers`, `RenderContext`             | the document format, read by the builder and collaboration                                                     |
| `./contracts` | `ExperienceKind`, `DocumentProblem`                                             | the document kinds (page, screen, form, email template, print document, theme section) and a validator problem |
| `./react`     | `DocumentRenderer`, `ReactRendererDriver`                                       | `<DocumentRenderer document={page.root} />` on the web                                                         |
| `./native`    | `DocumentRenderer`, `NativeRendererDriver`, `BlockProps`                        | the same on a phone; native `BlockProps` adds `onEvent`                                                        |

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
