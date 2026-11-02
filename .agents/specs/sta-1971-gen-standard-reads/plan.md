# Implementation Plan: gen writes the standard list and get reads a resource declares

**Spec**: `.agents/specs/sta-1971-gen-standard-reads/spec.md` · **Linear**: STA-1971 · **Date**: 2026-11-02

**Input**: Feature specification from `.agents/specs/sta-1971-gen-standard-reads/spec.md`

## Summary

This follows the generated search query (STA-1459). `@stackra/panel/node` gains two query kind bases,
`ResourceListQuery` and `ResourceGetQuery`, which read through the model's `CrudService`. For each resource operation
declared `true`, gen declares a subclass in the IR (`List<Models>Query`, `Get<Model>Query`) and writes it into
`#stackra/standard-reads`. Every target then treats it as an authored query: manifest, endpoint, wiring, client, command
and MCP tool.

The list input stays closed in two places, both from the same table data:

- the manifest's JSON Schema of each read's input, which gen writes per read (a dynamic map beside
  `GENERATED_QUERY_SCHEMAS`). The list input carries the sort enum of the sortable keys, the declared filter keys, and
  `search` only for a `@Searchable` model; the get input carries `<model>Id: PublicId<prefix>`. Tools and generated
  clients read this;
- the base at runtime, which gets the same table and id field as static options and refuses an undeclared key with a
  typed refusal. The action pipeline validates a call's input only against a schema gen registers through
  `registerActions`, and nothing calls that today, so the base is the server-side check.

The endpoint needs no input class: `deriveEndpoint` gives `x.get` → `GET /xs/:xId` and `x.list` → `GET /xs` from the
key alone.

Search is the member's own generated `Search<Model>Query` (STA-1459), injected into the list read's constructor. The
read narrows the table to its hits, so `@stackra/panel` gains no dependency on `@stackra/search` and the lockfile does
not change.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/experience/panel` (`tier:lib`, the two bases);
  `packages/commerce/loyalty-kit` (`tier:lib`, its regenerated manifest)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), on ci-box only
- **Storage**: none new; the reads use `CrudService.table` and `findOneOrFail`
- **Runtime target**: a library, the generated queries of every member that hosts such a resource

## Constitution Check

| Law                                   | Result | Note                                                                               |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | panel already depends on actions and database; gen writes the member's own files   |
| Secrets (ADR 0009)                    | PASS   | none                                                                               |
| Security                              | PASS   | every read carries the model's `read` permission; RLS and `VisibilityFilter` apply |
| HTTP and events                       | PASS   | `GET` by the endpoint convention (`x.list`, `x.get`); queries only, L0/L1          |
| Tenancy                               | PASS   | reads run in the caller's transaction and scope, through `CrudService`             |
| Delegation                            | PASS   | gen's generated-query area; panel's node entry gains two bases                     |
| Not built yet (ADR 0011)              | PASS   | nothing new introduced                                                             |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside each subject                                                   |
| Versions and catalogs                 | PASS   | no change                                                                          |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                  |
| Licence tier (ADR 0077)               | PASS   | free                                                                               |
| Docs and ADRs                         | PASS   | gen and panel READMEs; no ADR (implements ADR 0307 and `ResourceOperations`)       |

## Deploy modes

| Mode       | Behaviour |
| ---------- | --------- |
| SaaS       | same      |
| On-prem    | same      |
| Air-gapped | same      |

## Correctness properties

- **P-001**: a `list: true` resource yields exactly one list query over its model, with the closed table input — Validates: FR-001
- **P-002**: a `get: true` resource yields exactly one get query by public id — Validates: FR-002
- **P-003**: a hand-written query of the same key suppresses the generated one — Validates: FR-003
- **P-004**: a `true` operation is recorded as the generated read's locked key — Validates: FR-004
- **P-005**: a model with no `read` verb yields a refusal and no read — Validates: FR-005
- **P-006**: a generated read is a manifest action with an endpoint and a tool under the read permission — Validates: FR-006
- **P-007**: two resources of one model with different tables are refused — Validates: FR-007
- **P-008**: discovery records a resource's row type argument — Validates: FR-008

## Architecture overview

```
discover ──► ir.classes (resource: partner = model, row = second type argument; service: CrudService<Model>)
   │
   ├─ core: standardReadsOf(ir) ──► DeclaredClass per read (like searchQueriesOf), and refusals
   │        added to the authored IR before build-manifest, so actions, endpoint, tool and wiring follow
   │
   ├─ core: build-manifest ── the input JSON Schema per list read (closed: sort enum, filter keys, search?)
   │                         and the output (Page of row / row), into `schemas`; resourcesOf records
   │                         `operations.list` as the read's key (FR-004)
   │
   └─ core: emitStandardReads ──► .stackra/gen/standard-reads.ts (#stackra/standard-reads)
            class ListLoyaltyAccountsQuery extends ResourceListQuery(LoyaltyAccount, { key, table, row }) {
              constructor(service: AccountService) { super(service); } }
```

At runtime, `ResourceListQuery` refuses a sort key outside the sortable columns, a filter key outside the filters, and
`search` on a table without it (`resource_query_input_invalid`). It asks the injected search query for the phrase's hits when `search` is given, and narrows the filter to their ids. It calls
`service.table(input, { where })` and maps each entity to the row: `service.toRow(entity)` when the service declares it,
otherwise the row's fields picked by name. `ResourceGetQuery` turns `<model>Id` into the uuid (`publicIdToUuid`), calls
`service.findOneOrFail({ id })`, then maps the same way.

## Components and responsibilities

- **`ResourceListQuery(Model, options)`, `ResourceGetQuery(Model, options)`** (panel `src/node/bases/`): query kind
  bases (`Query({ key, actors })` underneath, actors user, agent and service as `SearchQuery` has). The options are the
  key, the table (sortable keys, filter keys, searchable) and the row field names, all static data gen writes.
- **Their input types and options** (panel `src/node/types/`): the wire form a list read takes (`{ cursor?, limit, sort?,
filter?, search? }`, as `tableInput` sends it), the get read's `{ [<model>Id]: string }`, and the static options gen
  writes (the key, the sortable and filter keys, searchable, the id field, the row fields).
- **`ResourceQueryInputInvalidError`** (panel `src/node/errors/`): the typed refusal of an undeclared input key.
- **Discovery** (`create-source-reader`): record a resource's second type argument (`row`) beside its partner (FR-008).
- **`standardReadsOf(ir)`** (gen core, new): for each resource operation `true`, one read per model; skip a key the member
  already declares; find the model's `CrudService` subclass. Refusals:
  - `standard_read_permission_missing`
  - `standard_read_service_missing` (no `CrudService<Model>` in the module)
  - `standard_read_table_conflict`
  - `standard_read_row_field_missing` (a row field the model lacks, and the service has no `toRow`)
- **`tableInputSchemaOf(tree, searchable)`** (gen core, new): the closed JSON Schema of one list input.
- **`emitStandardReads(ir)`** (gen core, new): `#stackra/standard-reads`. Per read, the query subclass with its static
  options and its constructor: the model's service, plus the model's search query for a searchable list.
- **`generate-member`** (changed): adds the reads to the authored IR as it does the search queries, and writes the file.
- **`build-manifest`** (changed): writes each generated read's input and output schemas from the IR's generated-schema
  map, as it does `GENERATED_QUERY_SCHEMAS`. The output is a `Page` of a `$ref` to the row's own schema, or the row.
- **`resourcesOf`** (changed): a `true` operation becomes the read's key (FR-004).

## Files and folders

- `packages/experience/panel/src/node/bases/resource-list-query.base.ts`, `resource-get-query.base.ts`, and tests
- `packages/experience/panel/src/node/types/resource-list-wire-input.type.ts`, `resource-get-wire-input.type.ts`,
  `resource-query-options.type.ts`
- `packages/experience/panel/src/node/index.ts` (exports), README
- `packages/developer/gen/src/core/functions/standard-reads-of.function.ts`, `table-input-schema-of.function.ts`,
  `emit-standard-reads.function.ts`, and tests
- `packages/developer/gen/src/core/functions/generate-member.function.ts`, `build-manifest.function.ts`,
  `resources-of.function.ts`, `src/node/functions/create-source-reader.function.ts`, and `DeclaredClass` (`row`)
- `packages/commerce/loyalty-kit/stackra.manifest.json` (regenerated), README
- `.changeset/gen-standard-reads.md`: `@stackra/gen` minor, `@stackra/panel` minor, `@stackra/loyalty-kit` patch

## Data models and migrations

none

## Contracts

Per resource with `list: true` and `get: true`, the member's manifest gains:

- `loyalty_kit.loyalty_account.list@1`: query, `GET /loyalty-accounts`, permission `loyalty_kit.loyalty_account.read`,
  tool. The input schema is the closed table input; the output is a `Page` of the row.
- `loyalty_kit.loyalty_account.get@1`: query, `GET /loyalty-accounts/:loyaltyAccountId`, the same permission, tool. The
  input is `{ loyaltyAccountId: PublicId<prefix> }`; the output is the row.

New gen refusals: `standard_read_permission_missing`, `standard_read_service_missing`, `standard_read_table_conflict`,
`standard_read_row_field_missing`.

## Error handling

Refusals go through the existing `GenError` path, and a refused run writes nothing. At runtime:

- an undeclared sort or filter key is the query's typed refusal, `table_input_invalid`, reusing `CrudService`'s
  `TableFilterInvalidError` where it applies;
- a missing record is `findOneOrFail`'s not-found refusal.

## Security and tenancy

Each read's permission is the model's `read` verb. A model without one is refused, not exposed. Reads run through
`CrudService`, so RLS and the bound `VisibilityFilter` apply. The tool is L0/L1 under the caller's permissions
(ADR 0155).

## Testing strategy

On ci-box only.

- **panel unit**: the list base refuses an undeclared sort or filter key, pages through a memory service, and maps by
  field and by `toRow`; the get base maps and passes not-found through.
- **gen unit**:
  - `standardReadsOf`: list, get, a hand-written key suppressing the read, and the four refusals;
  - `tableInputSchemaOf`: the sort enum, the filter keys, search only for a searchable model;
  - `emitStandardReads`;
  - `resourcesOf`: `true` → the key;
  - a generated `<model>.list` is a manifest action with a `GET` endpoint and a tool under the read permission (AC-005).
- **integration**: `stackra gen --check` on loyalty-kit after regenerating it; the playground unchanged.
- **manual (SC-003)**: commerce's count on a box.

## Rollout

One PR in core, after #266 and #277 (it uses #266's bindings for SC-002), released in the next `@stackra/*` minor.
Products gain the reads on their next gen bump, and their `unboundOperations` entries for list and get disappear.

## Tasks (outline)

1. Panel bases and schemas, with tests (FR-001, FR-002).
2. Discovery records the row type argument (FR-008).
3. `standardReadsOf` and `tableInputSchemaOf`, with refusals (FR-001 to FR-003, FR-005, FR-007).
4. Wire into `generate-member` and `build-manifest`; `resourcesOf` `true` → key (FR-004, FR-006).
5. `emitStandardReads` (FR-006).
6. Regenerate loyalty-kit; READMEs; changeset; box gate; commerce count.
