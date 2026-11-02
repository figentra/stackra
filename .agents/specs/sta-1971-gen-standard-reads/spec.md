# Feature Specification: gen writes the standard list and get reads a resource declares

**Feature Branch**: `figentra/sta-1971-gen-standard-reads`

**Created**: 2026-11-02

**Status**: Draft

**Tier**: big

**Approver**: leader

**Linear**: STA-1971

**Linear project**: none

**Clarifications status**: pending

**Analyze**: —

**Input**: User description: "Resources that declare `operations: { list: true, get: true }` (the 'standard reads gen
writes') get no generated `<module>.<model>.list@1` / `.get@1` query, so a host's `#stackra/resources` has nothing to
bind and those pages get no route. Gen should write those reads." Found in STA-1947 (PR 2, #266).

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none in this repository. Every product service hosting a module whose resource declares
  `list: true` or `get: true` gains two endpoints per resource on its next gen.
- **Packages touched**: packages/developer/gen (owner); the package holding the two new query kind bases (Q1:
  packages/experience/panel is recommended); packages/commerce/loyalty-kit (regenerated manifest)
- **Public contract change**: additive. Each such resource adds `<module>.<model>.list@1` and `<module>.<model>.get@1`
  to its member's manifest `actions`, with `GET` endpoints and MCP tools. A query key a member already uses is not
  generated (the hand-written query keeps its place).
- **Cross-service events**: none
- **Tenancy and data**: none new. The reads go through the model's `CrudService` (`table`, `findOneOrFail`), so
  row-level security and the bound `VisibilityFilter` apply as they do to any read.
- **Security and privacy**: each read carries the model's read permission (`<module>.<model>.read`). A model with no
  `read` verb on its Permissions class is refused, not exposed (FR-005).
- **Secrets**: none
- **ADR needed**: no. This implements ADR 0307 rules 1, 2 and 4 and `ResourceOperations`' `true` ("one gen writes over the
  model's service").
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none drawn here. The List and View pages of every such resource get their query, so #266's
  `unboundOperations` entries for them disappear.
- **Docs to update**: the gen README (generated queries section); the panel README if the bases land there
- **Lane**: full
- **Change risk**: R2 (generated public endpoints)

## Glossary _(full lane)_

- **Standard read**: the list or get query gen writes for a resource operation declared `true`.
- **Row**: the item type of the list output, the resource's second type argument (`Resource<Order, OrderView>`), or the
  model when there is none (ADR 0307 rule 1).
- **TableInput**: the closed list input gen compiles from a resource's table: the cursor and limit, sort as an enum of the
  sortable keys, a typed filter object of the declared filters, and `search` only for a `@Searchable` model (ADR 0307
  rule 2).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A `list: true` resource gets its list query (Priority: P1)

A module author declares `Resource<LoyaltyAccount, LoyaltyAccountView>({ operations: { list: true } })` and a table.
After `stackra gen`, the member declares `ListLoyaltyAccountsQuery` (key `loyalty_account.list`, so
`loyalty_kit.loyalty_account.list@1`). It takes the resource's TableInput, answers with a page of rows read through the
model's service, and appears in the manifest with its endpoint and tool.

**Independent Test**: gen on a package fixture with one resource; the manifest has the action entry, and the generated
file declares the class over the base.

**Acceptance Scenarios**:

1. **Given** loyalty-kit's resource, **When** gen runs, **Then** its manifest records `loyalty_kit.loyalty_account.list@1`
   and `.get@1`, and the resource tree's `options.operations.list` reads that key, not `true`.
2. **Given** a member that already declares a query keyed `loyalty_account.list`, **When** gen runs, **Then** no list read
   is generated and the hand-written one is bound.

### User Story 2 - A `get: true` resource gets its get query (Priority: P1)

The same resource with `get: true` gets `GetLoyaltyAccountQuery` (key `loyalty_account.get`). It takes the record's
public id and answers with the row read through `findOneOrFail`, so a missing or invisible record is the service's
not-found refusal.

### User Story 3 - A host binds them (Priority: P2)

An app that consumes the hosting service gets both reads in its generated client. Its `#stackra/resources` binds them,
and the List and View pages get routes (#266).

### Edge Cases

- **EC-01**: The row differs from the model and the model has no way to present it → refused, naming the resource (Q3).
- **EC-02**: The model's Permissions class has no `read` verb → `standard_read_permission_missing`, nothing generated.
- **EC-03**: A resource's model lives in another module of the member → the read goes in the model's module, which owns
  its service.
- **EC-04**: Two resources of one model (two areas) both declare `list: true` → one list read per model, shared, since
  the key is per model. If their tables differ, the reads are refused (`standard_read_table_conflict`), because
  ADR 0307 rule 2 binds a list query to one table.
- **EC-05**: `create`, `update` or `delete: true` → out of scope here (see Out of scope). They stay unbound and are
  recorded in `unboundOperations`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN a resource declares `operations.list: true` THE gen SHALL declare a list query for its model, key
  `<model>.list`, whose input is the resource's TableInput and whose output is a page of the resource's row.
- **FR-002**: WHEN a resource declares `operations.get: true` THE gen SHALL declare a get query for its model, key
  `<model>.get`, whose input is the record's public id and whose output is the row.
- **FR-003**: WHEN a member already declares a query with that key THE gen SHALL generate none for it.
- **FR-004**: WHEN gen records a resource whose operation is `true` and the read exists THE gen SHALL record that
  operation as the read's locked key.
- **FR-005**: IF the model's Permissions class has no `read` verb THEN THE gen SHALL refuse with
  `standard_read_permission_missing`.
- **FR-006**: WHEN gen writes a standard read THE manifest, endpoint, MCP tool, wiring and client SHALL treat it like an
  authored query (as the generated search query is, STA-1459).
- **FR-007**: IF two resources of one model declare `list: true` with different tables THEN THE gen SHALL refuse with
  `standard_read_table_conflict`.
- **FR-008**: WHEN gen reads a resource class THE discovery SHALL record its row type argument when one is given.

### Key Entities

- **Standard list read**: `List<Models>Query extends <ListBase>(Model, …)`, key `<model>.list`, input the TableInput,
  output `Page.of(Row)`.
- **Standard get read**: `Get<Model>Query extends <GetBase>(Model, …)`, key `<model>.get`, input `{ id }`, output Row.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN gen runs on loyalty-kit THE manifest SHALL record loyalty_kit.loyalty_account.list@1 and .get@1
- **AC-002**: WHEN a member hand-writes a `<model>.list` query THE gen SHALL generate no list read for that model
- **AC-003**: IF the model has no `read` permission verb THEN THE gen SHALL refuse with standard_read_permission_missing
- **AC-004**: WHEN an app consumes the service THE generated resources file SHALL bind the list and get reads

## Success Criteria _(mandatory)_

- **SC-001**: Every resource in this repository that declares `list: true` or `get: true` has its read in its member's
  manifest — verified by: unit and `stackra gen --check` on loyalty-kit.
- **SC-002**: A List and a View page of a composed resource route to working reads — verified by: unit (the bindings).
- **SC-003**: On ci-box, commerce's gen output gains one list and one get read per such resource; the count is reported
  to the leader — verified by: manual.

## Out of scope

- `create`, `update` and `delete: true` (writes over the model's service). They need input schemas from the form and a
  policy story. A follow-up issue will cover them.
- The `ListRows` map and typing table keys against the row (ADR 0307 rule 1's compile-time check).
- Hand-written list queries: they keep working, and FR-003 leaves them alone.

## Assumptions

- `CrudService.table(input, { where })` already applies a closed table input safely (ADR 0307 rule 2), and
  `findOneOrFail` already refuses an absent or invisible record. The standard reads add no SQL of their own.
- The generated search query (`searchQueriesOf` / `emitSearchQueries`, STA-1459) is the pattern: a kind base in a
  package, a generated subclass declared in the IR so every target treats it as authored.

## Open questions for clarify

- **Q1 (placement)**: where do the two kind bases live?
  - (a) `@stackra/panel/node`, recommended: every member with a resource already depends on the panel, and `true` is a
    panel concept.
  - (b) `@stackra/database`, beside `CrudService`.
  - (c) `@stackra/actions`.
- **Q2 (list input)**: compile the full closed TableInput per resource now (ADR 0307 rule 2: the sort enum, the typed
  filters, search when `@Searchable`)? Or ship a first cut with cursor, limit and sort over the table's sortable keys,
  with the typed filters in a follow-up? Recommended: full, since the table already declares its filters and
  `CrudService.table` takes them.
- **Q3 (row ≠ model)**: how is a model row turned into the resource's row (`LoyaltyAccountView`)?
  - (a) The model's service exposes `toRow(model)` (a `present` method), and gen refuses a resource whose row differs
    from the model without one.
  - (b) Gen picks the row's fields by name from the model, and refuses a row field the model lacks.
  - Recommended: (b), with (a) as the override when a service declares it.

## Amendments

None.

## Status history

- 2026-11-02 · — → Draft · Claude (STA-1947 session) · created
