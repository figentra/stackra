# Feature Specification: `@stackra/experience` wave 6, the Block kind, the document format and the renderers

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/experience` (experience, wave 6, registry row "`Block({ category, icon })` kind,
`DocumentRenderer`, `LocalizedText`"): blocks are registered code, a document is data naming block keys and props, and
the renderer resolves keys to registered blocks and refuses unknown ones; web renderer on `@stackra/ui`, native on its
native entry; the document format stays in `./contracts` for `@stackra/collaboration` and `@stackra/builder`.

## Impact

- **Apps touched**: none (the template's web, console and mobile apps use it, STA-344)
- **Services touched**: none
- **Packages touched**: `packages/experience/experience` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none stored; documents are tenant content rendered as data, never evaluated (ADR 0154)
- **Secrets**: none
- **ADR needed**: no (ADR 0110, 0112, 0114, 0270, 0294, 0305, 0154 and the registry v3.1 row decide it)
- **New dependencies**: none outside the workspace and the catalogs; `@stackra/clients`, `container`, `contracts`,
  `errors`, `i18n`, `icons`, `ui` and `validation` through `workspace:*`, `zod` from the default catalog; React as an
  optional peer
- **Deploy modes**: client and isomorphic library; same code in all
- **Licence tier**: free (MIT; ADR 0112 X5; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/experience/experience/README.md`, `packages/experience/experience/AGENTS.md`; ADR 0110, 0112, 0114 and 0270 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (renders tenant content; a defect draws a wrong or empty page, never runs code)

## Clarifications

### Session 2026-10-25

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR
0294, 0305). The choices recorded when it was specified:

- Registry A3 (`BlockProps` from `.` and `./native`): the two are different declarations. The template's console
  block (`welcome-hero`) renders without `onEvent` and navigates through the router, while the mobile block
  (`promo-banner`) must call `onEvent`. So `.` exports `BlockProps` without it and `./native` exports its own
  `BlockProps` that adds a required `onEvent`; no symbol is exported from two entries (ADR 0294 d15)
- `LocalizedText` is a map of BCP 47 tag to string (the wire form of `@stackra/model`'s `Translated`, which this
  package does not depend on). In a block's props a string-keyed map of strings is read as `LocalizedText`, by the
  type (`BlockProps` gives `string`) and at runtime (the renderer walks the block's generated schema), so the two
  never disagree and gen needs no new mapping
- The block registry follows `registerSchemas` and `registerShortcuts`: the generated wiring calls
  `registerBlocks([{ key, block, component }])` per target; a `@Renamed` block also registers under its old key
- The `Renderer` port renders a whole document for one target; `DocumentRenderer` reads it from the container, as the
  template's web wiring binds `react` to `ReactRendererDriver`
- The validator checks the whole tree before drawing (ADR 0110 d6, all or nothing): malformed node or refused props
  is `invalid_document`, an unregistered key is `unknown_block`
- A block's `accepts` query runs through `@stackra/clients`' `useQuery` with the node's `input`; a Skeleton from
  `@stackra/ui` holds the place while it loads and a failed query draws nothing for that block
- Action verbs reach the host's `onAction`; dispatching by key through the client needs a key lookup that
  `@stackra/clients` keeps internal (see Open items)
- The document schema is the `DocumentNode` type in `./contracts` (ADR 0294 d15 keeps that folder to ports, enums and
  types); the runtime check is `resolveDocument` in `.`

## User Scenarios & Testing

### User Story 1 - Declare a block (Priority: P1)

An app author writes `class HeroSectionBlock extends Block({ category: BlockCategory.Marketing, icon })` with its
props as fields, optionally `accepts: ListEntriesQuery`, and types its component with `BlockProps<typeof X>`.

**Independent Test**: `src/core/bases/__tests__/block.base.test.ts`, `src/core/types/__tests__/block-props.type.test.ts`, `src/native/block-props/__tests__/block-props.type.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Block({ category, icon })`, **Then** the kind registry records `{ category, icon, accepts: null }`.
2. **Given** a bad category, an empty icon or a non-query `accepts`, **Then** the declaration throws.
3. **Given** a block with a `LocalizedText` field, **Then** `BlockProps` types it `string`, and `data` is the accepted
   query's output.

### User Story 2 - Refuse a bad document (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/resolve-document.function.test.ts`, `src/core/functions/__tests__/register-blocks.function.test.ts`.

1. **Given** a node whose key nobody registered, **Then** `UnknownBlockError` with the key and path; nothing resolves.
2. **Given** props the block's schema refuses, **Then** `InvalidDocumentError` with the path, the block and the issues
   as the cause.
3. **Given** a published document naming a renamed block's old key, **Then** it still resolves.

### User Story 3 - Render a page on the web and a screen on a phone (Priority: P1)

**Independent Test**: the `./react` and `./native` tests beside `react-renderer.driver`, `native-renderer.driver`,
`document-renderer` and `block-node`.

1. **Given** `<DocumentRenderer document={page.root} />`, **Then** each node draws its registered component with every
   `LocalizedText` in the active locale.
2. **Given** a block that accepts a query, **Then** a Skeleton while it loads and the answer as `data` after.
3. **Given** a native block calling `onEvent({ verb: "navigate", route })`, **Then** the screen's `onNavigate` gets the
   route key.

### Edge Cases

- `null` or `undefined` document (a product with no description): nothing is drawn.
- A failed accepted query: that block draws nothing; the rest of the page draws.
- A verb with no handler: dropped.

## Requirements

- **FR-001**: The package SHALL be `@stackra/experience` at `packages/experience/experience`, `tier:lib`, entries `.`,
  `./contracts`, `./react` and `./native` only.
- **FR-002**: (template contract) `.` SHALL export `Block`, `BlockCategory` and the types `BlockProps` and
  `LocalizedText`; `./contracts` `Renderer`; `./react` `DocumentRenderer` and `ReactRendererDriver`; `./native`
  `DocumentRenderer` and the type `BlockProps` with `onEvent`.
- **FR-003**: `registerBlocks` SHALL register blocks per target all or nothing, under their key and their `@Renamed`
  key.
- **FR-004**: `resolveDocument` SHALL check a whole document against the registered blocks and their schemas before
  any drawing, refusing with `UnknownBlockError` or `InvalidDocumentError`, and SHALL read every `LocalizedText` in
  the locale.
- **FR-005**: The `react` and `native` drivers SHALL draw each checked node with its target's component, pass
  `onEvent` to the host's handlers, and fetch an accepted query's answer as `data`.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist; every template import resolves.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it (owner mode: no
  typecheck here).

## Open items (for the owner, not blocking)

- Template change (STA-344): the blocks' raw icon strings (`icon: "quote"`) become generated `Icons.*` constants
  (R-56); they type-check today because `IconName` is the string union behind the constants.
- Action verbs are handed to `onAction`; running one by key through the client needs `@stackra/clients` to expose its
  internal `CALL_REFS` lookup (or gen to pass the consumed action refs).
- Batching every block's query into one `experience.query.batch` call (ADR 0110 d2) waits for the experience service.
- Gen: `registerBlocks` per target in the generated wiring, the `native` candidate of `Renderer` in native wirings,
  and `LocalizedText` compiled as `z.record(z.string(), z.string())`.
- `CHANGELOG.md` is not written here: the repository hook reserves it for Changesets.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
