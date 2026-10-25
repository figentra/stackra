# Plan: `@stackra/experience` wave 6

**Spec**: `.agents/specs/sta-348-experience/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the `Renderer`
  port and the document format types), `.` from `src/core/` (isomorphic: the kind, the enum, the registry, the
  validator, the refusals, the types), `./react` and `./native` from their folders (the drivers, the
  `DocumentRenderer`s and the internal node drawing).
- `Block` is `createKind("block", BlockBase, readBlockOptions)`, cast so it can only be called; `BlockBase` carries a
  protected type-only brand, so `Fields<X>` is the declared props. `BlockClass<Q>` carries the accepted query in a
  type-only static for `BlockProps`.
- `BlockProps<B>` maps `Fields<InstanceType<B>>` through `Localized` (a string-keyed record of strings becomes
  `string`, recursively) and adds `data: QueryOutput<Q>` when the block accepts a query. Native `BlockProps` adds a
  required `onEvent`.
- `registerBlocks` validates key form, kind and component, then writes `BLOCK_ENTRIES` (with the `@Renamed` key) all
  or nothing. `resolveDocument` reads nodes, looks up entries, parses props with `schemaOf(block)`, walks the parsed
  value beside the schema (`localizeValue`: object, array, record, union, wrappers through `unwrap()`) to read every
  `LocalizedText` with `textIn` (exact tag, language, first), and records the accepted query from `kindOf`.
- The drivers call `resolveDocument` and draw `BlockNode`s; a node with `accepts` wraps the component in a query
  runner on `useQuery` with a `Skeleton` placeholder. `DocumentRenderer` reads the `Renderer` from `useContainer()`
  and the locale from `useLocale()`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/experience`; imports only `tier:lib` packages; no app, service or `encore.dev`           |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                         |
| Security                              | PASS   | documents are data only: no prop is evaluated, every node is checked against registered code first (ADR 0110, 0154)         |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                |
| Tenancy                               | N/A    | no tenant data stored; no `tenant` identifier declared                                                                      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests; a separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no runtime schema engine: documents reference registered code only (the allowed L2 row)                                     |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; the renderer is free (ADR 0112 X5)                                                                      |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand, the open items are listed in the spec                       |

- Boundaries: runtime imports of clients, container, contracts, errors, i18n, icons (types), ui, validation and zod;
  React as an optional peer; no other package's `./testing`.
- Versions: catalogs and `workspace:*` only.
- Naming: the kind `Block`, drivers `<Name>Driver`, refusals end in `Error`, Props in `<name>.props.ts`.

## Properties

- **P-001**: `package.json` names `@stackra/experience` at `packages/experience/experience` and `exports` lists only `.`, `./contracts`, `./react` and `./native` — Validates: FR-001
- **P-002**: every template import resolves with the shape it uses, and the barrel tests list each entry's exports exactly — Validates: FR-002
- **P-003**: for any batch, `registerBlocks` either registers every entry (and each renamed key) or throws and registers none — Validates: FR-003
- **P-004**: for any document, `resolveDocument` returns a node per input node with props equal to the schema's parse with each `LocalizedText` read in the locale, or throws before returning anything — Validates: FR-004
- **P-005**: for any checked tree, the drawn components and their order match the nodes, each `onEvent` reaches the matching handler, and an accepting block gets its query's answer as `data` — Validates: FR-005

## Deploy modes

| Mode       | Behaviour                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| SaaS       | a library, bundled into the consumer's app; documents from the experience service |
| On-prem    | identical: the same build, no SaaS-only code path                                 |
| Air-gapped | identical: needs no network beyond the host's own client calls                    |
