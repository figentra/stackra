<!-- Purpose: the reader guide of @stackra/database: entries, CRUD and graph reads, migrations (including column changes), macros, row-level security, sequences, projections, seeds, collations. Boundary: docs of packages/data/database only. Runtime: none (Markdown). Governing contract: ADR 0097; ADR 0159; ADR 0160; ADR 0342; ADR 0396; STA-918. -->

# @stackra/database

The MikroORM layer of Stackra on Postgres: `CrudService<M>` with resource-table and metrics reads, repositories, the
graph reader, the `Migration`, `Macro` and `Seeder` kinds with the migration compiler, the `idx_`/`fk_`/`ck_` naming
strategy, the unit of work and scope sessions, gapless `Sequence` numbers, `Projection` read models with `asOf` reads, the record-visibility filter seam, and the
`Factory`, `usePostgres` and PGlite memory-driver test helpers.

**Tier:** `tier:lib` (`packages/data/database`), entries `.`, `./contracts`, `./node` and `./testing` (the template's old `./orm` is folded into
`.`). The only package that imports `@mikro-orm/*` (ADR 0097). Server only: no ORM on a client (ADR 0227, 0256).

## Entry points

| Import                        | Holds                          | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/database`           | `src/core/`: node runtime      | `CrudService`, `Repository` (t), `repositoryOf`, `GraphQuery`, `Aggregate`, `MixedCurrencyError`, `TableFilterInvalidError`, `TableFilter` (t), `TableSort` (t), `Migration`, `MigrationId` (t), `Macro`, `Seeder`, `Blueprint` (t), `ColumnChange` (t), `SchemaBuilder` (t), `ColumnGroup` (t), `RowLevelSecurityOptions` (t), `Extension`, `compileMigration`, `table`, `sql`, `operationAction`, `operationQuery`, `Database`, `StackraNamingStrategy`, `registerEntities`, `registerModelPartners`, `EntitySchema`, `OptionalProps`, `UniqueViolation`; sequences: `Sequence`, `SequenceService`, `registerSequences`, `formatSequenceNumber`, `SequenceNotReservableError`, `SequenceBlockClosedError`, `SequenceNumberOutOfOrderError`, `SequenceOptions` (t), `SequenceClass` (t), `SequenceRegistration` (t), `SequenceSeries` (t), `SequenceNumber` (t), `SequenceBlock` (t), `SequenceReserveOptions` (t); visibility: `connectVisibilityFilter`; legal holds: `connectHoldRegistry`, `disposableIds`, `registerHoldLinks`, `HoldSubscriber`, `RecordHeldError`; `connectSequenceTimeZone`; read models: `Projection`, `ProjectionClass` (t), `ProjectionOptions` (t), `ProjectionReadOptions` (t), `ProjectionRow` (t) |
| `@stackra/database/contracts` | `src/contracts/`: node runtime | `VisibilityFilter`, `HoldRegistry`, `HoldChannel`, `Disposal`, `HoldLinks` (t), `SequenceTimeZone`, `Where` (t), `ConnectionResolver`, `PRIMARY_CONNECTION`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@stackra/database/node`      | `src/node/`: node runtime      | `PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver`, `PostgresIdempotencyStoreDriver`, `PostgresRateLimitStoreDriver`, `ServiceHoldRegistryDriver`, `PrimaryConnectionResolverDriver`, `migrate`, `rollback`, `seedState`, `applySeed`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `@stackra/database/testing`   | `src/testing/`: tests only     | `Factory`, `Faker` (t), `usePostgres` (compiled migrations or a `migrationsDirectory`), `assertRowSecurity` and `RowSecurityOptions` (t), `MemoryDatabaseDriver` (the PGlite `memory` driver of `Database`), `DATABASE_TESTING_PLUGIN` (connects a memory database per testing module and adds `.seed(...)`, `app.transaction(...)` and `app.repository(...)`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts`, `src/contracts/index.ts`, `src/node/index.ts` and `src/testing/index.ts` are stand-in barrels.

## A module service

```ts
import { CrudService } from "@stackra/database";

export class OrderService extends CrudService<Order> {
  constructor(private readonly lifecycle: OrderStateMachine) {
    super();
  }

  findStale(cutoff: Date, limit: number): Promise<Order[]> {
    return this.find({ status: OrderStatus.PendingPayment, createdAt: { $lt: cutoff } }, { limit });
  }
}

// a list query: the resource table's closed input, plus the rows the caller may see
const page = await orders.table(input, {
  where: { customerId: ctx.actor.id },
  populate: ["lines"],
});

// a KPI query: the period and the previous period in one statement
const paid = orders.metrics(period, { on: "paidAt", where: { status: OrderStatus.Paid } });
const [revenue, series] = await Promise.all([
  paid.sum("total.minor"),
  paid.series(Aggregate.Sum, "total.minor"),
]);
const average = await paid.value(Aggregate.Avg, "total.minor"); // also Min, Max, Distinct
const weekly = await paid.series(Aggregate.Count, undefined, MetricGrain.Week);
const byChannel = await paid.breakdown("channel", Aggregate.Sum, "total.minor", 5);
```

- `metrics(period, { on, where, timeZone })` reads the period and the previous one in one statement per call.
  `value(aggregate, path?)` takes any `Aggregate` (`count`, `sum`, `avg`, `min`, `max`, `distinct`); `series` buckets
  by `MetricGrain` (hour, day, week from Monday, month, quarter) on the local calendar of `timeZone`, which defaults to
  the running call's `ctx.timeZone` and else UTC, so a day across a daylight-saving change stays one local day; a series
  holds at most 5,000 buckets. `breakdown(dimension, aggregate, path?, limit = 10)` groups by a single-column field,
  largest current value first. A money aggregate over two currencies refuses with `mixed_currency`.

- The model comes from the type argument (gen registers it with `registerModelPartners`); the entity manager is the
  running context's, so every write joins the action's unit of work (`DatabaseUnitOfWorkDriver`).
- `findOneOrFail` refuses with `not_found`; `insert` writes now and throws `UniqueViolation` without spoiling the
  caller's transaction; a money `sum` over two currencies refuses with `mixed_currency`.
- Raw SQL is a parameterised condition, or a list of them ANDed: `{ $raw: sql\`${StockLevels.columns.onHand} <= ${n}\` }`,
with columns from gen's `table(...)` constants (ADR 0160).
- The operator helpers build those conditions for you, each value a parameter:
  - `jsonContains(Bookings.columns.resourceIds, [resourceId])`: a jsonb column contains the value (`@>`, GIN-indexable).
  - `jsonPath(Entries.columns.live, ["slug", locale], slug)`: the value at a jsonb path equals a JSON scalar (`null`
    also matches an absent path), so a nested read needs no cast of the model's filter type.
  - `ancestorOf(Connections.columns.scopePath, path)`: an `ltree` column is the path or above it (`@>`).
  - `descendantOf(Shops.columns.scopePath, path)`: an `ltree` column is the path or below it (`<@`).
    These narrow a read inside row-level security; they are never isolation (ADR 0327 d9).
- `table(input, { where, populate, period })` reads one cursor page of a resource table. Each `input.filter` value is
  a `TableFilter`: a value (equal), a list (any item), or an operator object, `{ op: "range", from, to }` (inclusive),
  `{ op: "dateRange", from, to }` (to exclusive; a date-only `to` covers its day) or `{ op: "dateRange", range:
"last_7_days" }` (resolved by `period`, which a list query passes as `ctx.period`), `{ op: "gt" | "gte" | "lt" |
"lte" | "ne", value }`, `{ op: "contains", value }` (case-insensitive, a pg_trgm index serves it) and
  `{ op: "isNull", value }`. Any other object is refused with `table_filter_invalid`, so no ORM operator comes from a
  caller. `input.sort` is one key or up to three (`TableSort[]`); the primary key always ends the order. Gen refuses a
  sort or filter on an unindexed path (`sort_not_indexed`, `filter_not_indexed`).
- `table(input, { count: Count.Estimated })` adds the matching rows' count to the page (`page.count`, a `TableCount`).
  `Count.Estimated` counts exactly up to `BULK_LIMITS.countCap` (10,000) rows and past it returns
  `{ value: 10000, capped: true, estimate }`, the planner's estimate from `explain`, so a list shows "10,000+" without
  a full scan (ADR 0307 rule 12). `Count.Exact` counts every row, for a small table. Without `count` the page has none.
- `countDistinct(field, where?)` counts the distinct non-null values of a field over the visible matching rows
  (`usage.countDistinct("subjectId", { meterId })`).
- `lock(where)` reads the row again under `select ... for update`, held until the transaction ends, so a second caller
  waits: a single-flight token refresh locks the connection row, then re-checks the expiry. It needs a transaction.
  `lock(where, { shared: true })` takes `for share`; `{ nowait: true }` fails at once on a held row (`55P03`, raised as
  the retryable `transaction_conflict`); `{ skipLocked: true }` locks the first free match and returns `null` when
  every match is held, the claim step of a work queue. `nowait` and `skipLocked` exclude each other.
- `increment(where, field, by = 1)` adds to a numeric field in one statement (`col = col + ?`), so concurrent hits
  never lose a count; it returns the rows changed.
- `update(where, data, { requiresNew: true })` writes now in a transaction of its own that commits even if the
  caller's rolls back (an attempt counter kept across a failed delivery), as `insert` does.

### Bulk verbs and the offset page

```ts
await products.insertMany(rows); // one flush, batched inserts
const { created, updated } = await products.upsert(rows, { by: ["scopeId", "sku"] });
await orders.updateWhere(
  { status: OrderStatus.Pending, createdAt: { $lt: cutoff } },
  { status: OrderStatus.Void },
);
await sessions.deleteWhere({ expiresAt: { $lt: now } });
for await (const order of orders.each({ status: OrderStatus.Paid }, { batch: 1000 }))
  await reindex(order);
const page = await orders.page({
  page: 2,
  perPage: 50,
  sort: { key: "createdAt", direction: SortDirection.Desc },
});
```

Every bulk verb writes what the flush path writes: stamps, encrypted fields sealed, and a change record on the feed.

| Verb                       | How it writes                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `insertMany(rows)`         | creates every row and flushes once in a savepoint (`requiresNew` for its own transaction); the ORM batches the inserts    |
| `upsert(rows, { by })`     | reads stored rows by the `by` values (kept rows too), assigns the matches, creates the rest, flushes once; returns counts |
| `updateWhere(where, data)` | one native statement with the stamps (and `version + 1` on a `Versioned` model), reported to the change feed              |
| `deleteWhere(where)`       | `delete`: soft delete, archive or a hold-aware hard delete by the model's policy                                          |
| `each` / `chunk(where)`    | keyset reads of `batch` rows (500, at most 10,000) by the primary key; visibility and delete filters apply                |
| `page(input, { where })`   | an offset page (`perPage` 1 to 500) with `total` and `pages`; sorts as `table` does                                       |

`updateWhere` that sets a field the model encrypts runs through the unit of work in batches instead, because a native
statement would store it in clear. `upsert` refuses a row without a `by` value and a key named twice; a concurrent
insert of the same key fails the flush with the unique violation (a retryable `conflict` at the action boundary), so
wrap an import in `retry`. `AppendOnly` models refuse `upsert`, `updateWhere` and `deleteWhere`. Use `table` (cursor)
for long lists and `page` only where a pager needs page numbers.

### Reads on a replica

```ts
const visits = await database.onReplica(() => this.visits.find({ day: { $gte: from } }));
```

- `PostgresDatabaseDriver.connect({ url, replicas })` takes the replicas' connection strings from the runtime
  (runway's `readReplica`, ADR 0057 d6). Every read stays on the primary unless it runs in `Database.onReplica`.
- `onReplica(work)` opens a read-only transaction on a replica and replays the running transaction's `app.*` settings
  (scope and tenant) there, so row-level security holds. The replica lags and never sees the caller's uncommitted
  writes, so use it for reports and dashboards, never read-your-write paths. With no replica it runs `work` as it is.
- A query that declares `reads: "replica"` (`@stackra/actions`) runs its `handle` there through
  `DatabaseReplicaReadsDriver`, the `database` driver of the `ReplicaReads` port. After a caller's action commits, its
  replica queries read the primary for `DatabaseConfig.readYourWrites` (5 seconds by default), keyed by scope and
  actor. The driver remembers writes per instance; the transport carries the last write to other instances as
  `CallOptions.lastWriteAt`.

## A migration

```ts
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

export class CreateOrdersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("orders", (t: Blueprint) => {
      t.hasPublicId("ord");
      t.timestamps();
      t.string("customer_id", 30).notNull().comment("The customer who placed it.");
      t.money("total").notNull().comment("Amount charged.");
      t.index(["customer_id"]);
    });
  }
}
```

`compileMigration(Class, { schema, createsSchema, macros })` turns it into ordered SQL steps with dev-only inverses.
It refuses a column without explicit nullability or a comment, a NOT NULL column added without a default, an index on
an existing table that is not `concurrently()` (which compiles to its own non-transactional step), a concurrent index on
a new table, an extension outside ADR 0160's five and PostGIS (ADR 0314), and a raw `schema.sql` without its `inverse`. A package's `Macro`
merges into `Blueprint` (gen writes the type) and is installed by name.

A foreign key (`belongsTo`) or enum check added to an existing table compiles to `add constraint ... not valid` in the
transaction, so the add takes no scan, and to one `validate constraint` step per constraint after it, which scans
under a lock that lets writes continue (ADR 0159 d3, stackra-251). On a table the migration creates, both stay inline.
CI lints the compiled `.up.sql` files with Squawk.

Public-id key columns (`hasPublicId`, `belongsTo`, `link`) are `varchar(33)` by default; compiled with
`publicIds: "uuid"` they are native `uuid` (ADR 0135, 2026-10-28 amendment), read and written through
`@stackra/model`'s `PublicIdType` and `LinkType(model, prefix)` codec. Principal stamps and `scope_id` stay text.

### Changing a column

On an existing table (`schema.table`), `t.change(column)` changes a column in place, as a frozen step whose inverse is
derived from the migration's own literals:

```ts
schema.table("balances", (t: Blueprint) => {
  t.change("member_id").nullable(); // DROP NOT NULL (expand)
  t.change("points").type("bigint", { from: "integer" }); // TYPE bigint USING "points"::bigint
  t.change("note").type("text", { from: "varchar(200)", using: 'trim("note")' });
});
```

`nullable()` is an expand step; `notNull()` is a contract step (Postgres scans the table under an exclusive lock, so
the backfill ships in an earlier release). `type(to, { from, using? })` takes the SQL types a blueprint writes and
states the type the column had, so the inverse converts back without reading the database; most type changes rewrite
the table, so a large one adds a new column and backfills it instead. A change is refused on a table being created, on
a column the same blueprint adds, twice for one column, or when it changes nothing. Changes compile before the
blueprint's added columns.

Besides `integer` (32-bit), `t.bigint(name)` is a 64-bit count or minor-unit amount outside `money`, and
`t.decimal(name, precision, scale)` an exact `numeric` reading or bound (precision 1 to 1000, scale 0 to precision);
money is always `t.money`.

### Running migrations

`stackra db migrate` (`migrate` from `./node`) applies the compiled `.stackra/migrations` files in order:

- It holds a session-level `pg_advisory_lock` for the whole run, so a second pod or job waits instead of applying the
  same files.
- `schema_migrations(version, dirty)` keeps golang-migrate's shape; `schema_migrations_history(version, name,
checksum, applied_at)` records each applied file's SHA-256. A run refuses to start when an applied file's text no
  longer matches (a frozen migration was edited); files applied before the ledger existed are recorded on the first
  run. A dev `rollback` removes the reverted rows.
- Sessions run with `lock_timeout 5s` and `statement_timeout 5min`; a file whose leading comment lines hold
  `-- stackra:timeout=30min` runs with its own statement timeout.
- When a file fails, the INVALID indexes it named (a failed `create index concurrently`) are dropped and the version
  goes back to the last applied file, clean, so the next run starts that file again. Only a crash mid-file leaves the
  version dirty.

## Scope isolation

Isolation stays in the database: row-level security, never an application WHERE filter (ADR 0327 d9,
`.agents/rules/tenancy.md`). A scope is a contracts `ScopeRef`, a node's `scp_` id and `ltree` path; levels are
deployment data, so this package names none (ADR 0327 d2, d5).

```ts
schema.createExtension(Extension.Ltree);
schema.create("documents", (t: Blueprint) => {
  t.hasPublicId("doc");
  t.scopeId().notNull().comment("The scope node the document belongs to."); // varchar(33), indexed
  t.scopePath().notNull().comment("The node's path, denormalised."); // ltree, GiST index
  t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
});

await database.withScope({ id: principal.scopeId, path: principal.scopePath }, () => work());
await database.withScope(principal.grantedScopes, () => work()); // several granted scopes
```

- `t.rowLevelSecurity(column, { setting, match })` writes ENABLE, FORCE and the generated policy
  `pol_<table>_<column>`. `equals` compares the column with `current_setting(setting, true)` (`@stackra/tenancy` uses
  it for its isolation column, ADR 0239); `ancestor` matches an `ltree` column at or below any of the setting's
  `|`-separated paths, through the GiST index. An unset or `''` setting matches no row, so a pooled connection that
  ran an earlier scope sees nothing. A blueprint takes one `rowLevelSecurity` call: Postgres ORs permissive policies.
  `inherited` is `ancestor` plus a select-only policy `pol_<table>_<column>_inherited` for the rows on the path above a
  granted path, so a template seeded at the platform or product node is read by every tenant below it and written by
  none of them (ADR 0412). `equalsOrUnset` is `equals` through `is not distinct from`: a nullable id column's null
  rows (platform rows) match a session with the setting unset; a scoped session sees only its own (STA-1300).
- `service.repath(from, to)` (every `CrudService` over a model with `scopePath`) moves a scope subtree's rows: each
  path at or below `from` takes `to` in place of that prefix, in one statement in the caller's transaction. A service
  calls it from its listener of `@stackra/scope`'s `ScopeMoved`, in a scope that reaches both paths (ADR 0411).
- `Database.withScope(scope | scopes, work)` sets, for the transaction, `app.scope_id` and `app.scope_path` when one
  scope is given and `app.scope_paths` (every granted path joined by `|`) always; no granted scope means no rows. A
  path that is not an `ltree` path is refused.
- `t.scopeId()` and `t.scopePath()` are the scope-tree columns `@stackra/scope` and `@stackra/tenancy` build on;
  tenancy's `belongsToTenant` stays in tenancy.

### Trees (`HasTree`)

A model with `@stackra/model`'s `HasTree` (categories, organisation units) holds `parentId` and an `ltree` `treePath`:
its ancestors' ids then its own. Its migration writes `t.tree()` (`parent_id`, indexed, and `tree_path` with a GiST
index; the database needs `Extension.Ltree`), and the boot passes `new TreeSubscriber()` in
`DatabaseOptions.subscribers`.

```ts
const shoes = await categories.insert({ name: "Shoes", parentId: root.id }); // treePath "cat_root.cat_shoes"
await categories.children(root.id); // rows whose parentId is root.id
await categories.descendants(root.id); // every depth below, each after its parent (GiST `<@`)
await categories.ancestors(shoes.id); // root first (`@>`)
await categories.move(shoes.id, sale.id); // the subtree moves in one statement
```

- `TreeSubscriber` writes `treePath` on create from the parent's (from the same flush, or read in the flush's
  transaction, so row-level security applies); a parent it cannot read refuses the create.
- `treePath` is a system field (`system_field_write`), and `update`, `updateWhere` and `upsert` refuse `parentId`: a
  record changes parent only with `move(id, parentId | null)`, the `repath` rewrite on `treePath`, which refuses a move
  under itself. Both records must be visible to the caller.
- A record's id is its path label, so it must be an `ltree` label; every `HasPublicId` id is.

## Gapless sequences

Invoices, receipts and filings take numbers with no gaps that are never reused (ADR 0342). A module declares a series
in its `database/sequences/` group and never writes its own counter table:

```ts
// src/modules/billing/database/sequences/invoice.sequence.ts — locked as billing.invoice
export class InvoiceSequence extends Sequence({
  key: "invoice",
  series: ["legalEntityId"], // dimensions beyond the scope
  format: "INV-{year}-{n:06}", // {n}, {n:06}; {year} only with reset "yearly", and required by it
  reset: "yearly", // or "never" (the default)
  reserve: { size: 50 }, // blocks for offline issue; false (the default) = online only, in date order
}) {}

// inside the action that writes the invoice, as its last write
invoice.number = (
  await sequences.next(InvoiceSequence, ctx.scope, { legalEntityId }, ctx.timeZone)
).formatted;
```

- `next` runs in the caller's transaction and refuses outside one: the number is taken from a counter row locked
  until commit, so two commits never share a number and a rolled-back write takes none. The series waits on that row
  while the transaction runs, so call it last; a hot series adds a dimension, not a second counter.
- Offline issue: `reserve(sequence, scope, series, { holder })` hands a device a block at sync; `claim(sequence, {
block, holder, number })` accepts each number it issued, in the document's transaction, and voids the numbers it
  skipped; at the next sync `release(block, holder)` returns the unused remainder (the counter steps back when the
  block is its tail, else the remainder is handed out first), and when a device is wiped `void(block, reason)` records
  it as voided numbers. A block carries its `format` and `period`, so the device formats exactly as the server does.
- Gen registers each class with its locked key (`registerSequences`); an unregistered sequence is refused, never
  counted under its written key. Refusals: `sequence_not_reservable`, `sequence_block_closed`,
  `sequence_number_out_of_order`, and `not_found` for a block the caller may not use.
- The tables (`database.sequence_counters`, `sequence_blocks`, `sequence_voids`) come from this package's migration
  `database.0001_create_sequence_tables`; each carries the scope columns and the ancestor policy, so a session takes
  numbers only in its granted scopes.
- The year of a yearly series is read in the time zone its owner's setting names (ADR 0394): the product that owns
  the series binds a `SequenceTimeZone` driver over its settings (a legal entity's numbering time zone), and gen's
  boot connects it (`connectSequenceTimeZone`). With none bound, or the setting unset, the caller's time zone governs.
- Gen checks a sequence sits in its module's `database/sequences/` group (`sequence_misplaced`), and the migration
  compiler refuses a raw `CREATE SEQUENCE`: a document number is always a `Sequence`.

## Read models

A consumer's copy of another service's data is a `Projection<Row>({ key })` in the module's `models/` group (ADR 0294
decision 16, ADR 0305 rule 5, ADR 0163 decision 1). It is a binding: the listeners of the source's integration events
inject it and write; reports and queries inject it and read.

```ts
import { Projection } from "@stackra/database";

export class OrderBook extends Projection<OrderBookRow>({ key: "order_book" }) {}

// in a Listener of the source's OrderPaid; `event.scope` is the scope node the source event carries
await this.book.put(
  event.scope,
  event.orderId,
  { status: "paid", totalMinor: event.totalMinor },
  ctx.occurredAt,
);
await this.book.remove(event.scope, event.orderId, ctx.occurredAt);

// in a report's query
const row = await book.get("ord_01", { asOf: endOfMonth });
const page = await book.list({ after: lastId, limit: 500 });
```

- Rows are versions in `database.projection_rows` (migration `0004_create_projection_rows`): one per write, closed by
  the next, so `asOf` reads any past moment. Scope isolation is the table's forced ancestor policy.
- `put` and `remove` take the event's time and return `false` without writing when the current version is as new or
  newer, so a redelivered or late event never rolls a record back.

## Action stores on Postgres

`PostgresIdempotencyStoreDriver` and `PostgresRateLimitStoreDriver` are the durable drivers (name `postgres`) of
`@stackra/actions`' `IdempotencyStore` and `RateLimitStore` ports, for a deployment that runs no Valkey (ADR 0396).
Their tables come from `database.0002_create_action_store_tables`; each call commits in its own transaction, so a
claim holds before the action's unit of work starts. Selecting them in runway (`config.actions.stores`) needs
`@stackra/actions` to list `postgres` among its store driver names.

## Seed runner

`stackra seed-pack <product>` calls `seedState` and `applySeed` from this entry (ADR 0396). They keep the seed ledger,
`database.seed_records` (migration `database.0003_create_seed_records`): one row per pack record with its content
hash, pack version, profile and owner. `applySeed` writes product defaults in one transaction and never overwrites a
row whose owner is `tenant`; the owning package flips the owner when someone edits the product default. The
connection is `directDatabaseUrl()`, as for `stackra db migrate`, which runs first (see Connection pool).

## Record visibility

A declaring model's reads carry visibility conditions on top of row-level security, never instead of it (ADR 0333
d4–d5). This package is the seam; the model's facet and the policy decision point's evaluation are another package's
`VisibilityFilter` driver:

```ts
export class IamVisibilityFilterDriver extends Driver(VisibilityFilter) {
  async conditionsFor<M extends object>(
    model: AnyClass<M>,
    principal: Actor | undefined,
  ): Promise<Where<M>> {
    return this.decisions.visibleWhere(model, principal); // {} when the model declares nothing
  }
}

connectVisibilityFilter(container); // at boot, beside connectExtensions
```

With a driver bound, `CrudService`'s `find`, `findOne`, `findOneOrFail`, `count`, `sum`, `table` and `metrics`, and
`GraphQuery`'s source rows, AND its conditions into their filter for the running call's actor (`undefined` outside a
call; the driver decides what that sees). Without one, reads are unchanged. Writes and `purge` carry no conditions.

## Delete policies

A model's traits choose its delete policy (ADR 0134 decision 4), and `CrudService` applies it:

| Model                             | `delete(where)`             | Reads                           | Back             |
| --------------------------------- | --------------------------- | ------------------------------- | ---------------- |
| `SoftDeletes` (`t.softDeletes()`) | sets `deletedAt` (stamped)  | hidden by the `deleted` filter  | `restore(where)` |
| `Archivable` (`t.archivable()`)   | sets `archivedAt` (stamped) | hidden by the `archived` filter | `restore(where)` |
| neither                           | hard delete through `purge` | —                               | —                |

The drivers register both filters at `connect`, on by default and limited to the entities with the trait. A read
reaches hidden rows with `{ withDeleted: true }` or `{ onlyDeleted: true }` (`withArchived`, `onlyArchived` for
archived rows), on `find`, `findOne`, `findOneOrFail` and `count`. `forceDelete(where)` and `purge(where)` remove
rows for good, kept ones included, and a legal hold still protects them. A soft delete or an archive is an update,
not a disposal. A unique index on a soft-deleted table says `.where("deleted_at is null")`.

## Append-only tables

An `AppendOnly` model (a ledger entry, an audit record) is inserted and never changed; a correction is a new row
(`HasCorrections`). Three layers hold it:

- `CrudService` refuses `update`, `increment`, `delete`, `restore` and `repath` with `AppendOnlyWriteError`
  (`append_only_write`, `failed_precondition`). `purge` and `forceDelete` still remove rows: retention and erasure.
- `AppendOnlySubscriber` (in the generated boot's subscribers) refuses a flush that changes a loaded row (`em.assign`).
- `t.appendOnly()` in the table's migration revokes `UPDATE` from `public` and the migrating role, so a native or raw
  write fails in Postgres too. Gen refuses an own `AppendOnly` model whose table no migration revokes it on
  (`append_only_not_revoked`).

## Partitioned tables

A table that grows without bound (outbox changes, access log, meter events, audit, projections) is range-partitioned
by time with native Postgres partitioning, no extension. The model declares
`Partitioned({ by: "occurredAt", interval: "month", premake: 2, retain: Duration.days(400) })` (`@stackra/model`) and
its migration creates the table with `t.partitionBy("occurred_at")`:

- the table is `partition by range ("occurred_at")`, the column joins the primary key, a `<table>_default` partition
  catches rows no dated partition covers, and a BRIN index on the column is added (`{ brin: false }` skips it);
- the column must be NOT NULL and every unique index must include it; an existing table is never converted.

`maintainAllPartitions(now)` (`.`) runs `maintainPartitions(model, now)` for every registered `Partitioned` model; the
daily job that calls it at 02:15 UTC, `data_maintenance.partition.maintain@1` (system actor), lives in the add-on
`@stackra/data-maintenance` (ADR 0462 decision 1). Each model's upkeep creates the current partition and
`premake` ahead (`<table>_p<yyyymmdd>`), and detaches and drops each dated partition whose span ended more than
`retain` ago, unless the `HoldRegistry` holds one of its rows (`Disposal.Retention`); a held partition is kept and
reported. The job puts the partition names in its audit entry.

## Concurrency and database errors

A `Versioned` model's `version` is the ORM's version property, so a unit of work that flushes a row someone else
changed fails. `CrudService.update(where, data, { expectedVersion })` refuses earlier, before anything changes, when
the row is no longer at the version the client read; an action passes `ctx.expectedVersion`, which the transport
fills from `If-Match`.

`DatabaseUnitOfWorkDriver` raises what leaves an action's transaction as a refusal (`translateDbError`, exported for a
module's own transaction):

| Database error                                                                            | Refusal                    | Status         |
| ----------------------------------------------------------------------------------------- | -------------------------- | -------------- |
| Optimistic lock (version mismatch)                                                        | `StaleVersionError`        | 409            |
| Unique violation (`23505`)                                                                | `DuplicateRecordError`     | 409            |
| Foreign key, check, not null (`23503`, `23514`, `23502`)                                  | `ConstraintViolatedError`  | 400            |
| Serialization, deadlock, lock not available, timeout (`40001`, `40P01`, `55P03`, `57014`) | `TransactionConflictError` | 503, retryable |

### Transaction options

```ts
await database.transaction(() => seats.book(showId, seat), {
  isolation: Isolation.Serializable,
  retry: 3,
  lockTimeout: Duration.seconds(2),
});
```

| Option        | Effect                                                                                             | Inside a running transaction |
| ------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `requiresNew` | a transaction of its own that commits even if the caller's rolls back                              | starts one                   |
| `timeout`     | `set local statement_timeout`                                                                      | yes, until the outermost end |
| `lockTimeout` | `set local lock_timeout`: a lock wait longer than this fails with `55P03`                          | yes, until the outermost end |
| `isolation`   | `Isolation.ReadCommitted` (the default), `RepeatableRead` or `Serializable`                        | refused (`TypeError`)        |
| `readOnly`    | starts the transaction read-only; a write fails with `25006`                                       | refused (`TypeError`)        |
| `retry`       | runs the whole work again (0 to 10 times, jittered back-off) after `40001` or `40P01`, then leaves | refused (`TypeError`)        |

`isolation`, `readOnly` and `retry` belong to a transaction's start: a savepoint cannot change them, and a deadlock aborts
the whole transaction, so inside a running one pass `requiresNew` as well. A retried work must be safe to run again;
external calls belong in `afterCommit`. A lock-not-available (`55P03`) or statement timeout (`57014`) is never retried
here. Both drivers run `transaction` through the same `runTransaction`, so the memory driver behaves the same.

Inside `handle`, the driver's own error still arrives first, so a service that treats a `UniqueViolation` as "already
there" keeps catching it. The refusal names the constraint, never a value.

## Stamps

`StampSubscriber` (from `.`, passed in `DatabaseOptions.subscribers` by the boot) fills the `Timestamps` and
`UserStamps` fields of every unit-of-work write: on a create `createdBy` and `updatedBy` take the running call's actor
id (a value already set, as by a seed, is kept); on an update `updatedAt` moves and `updatedBy` takes the actor.
`CrudService.increment` and `repath` are native updates with no entity event, so they set the same fields
themselves. The actor comes from the call's `ContextStorage` through the resolver `connectVisibilityFilter` named; a
`system` actor or a write outside a call stamps no principal.

## Retention

`pruneAllRecords(now)` (`.`) runs `pruneRecords(Model, now)` for every registered model with
`Retention({ keep, basis, policy })` or `SoftDeletes` in the running scope (ADR 0134 decision 3, ADR 0189 decision 4).
The job that calls it at 03:00 UTC once per scope, `data_maintenance.record.prune` (system only), lives in the add-on
`@stackra/data-maintenance`:

- `Retention` with `policy: "hard"` deletes rows whose `basis` date is older than `keep`; `"soft"` sets `deletedAt`
  (needs `SoftDeletes`), `"archive"` sets `archivedAt` (needs `Archivable`; a missing trait is a `TypeError`).
- Every `SoftDeletes` model's rows soft-deleted more than 30 days ago are deleted for good.
- Deletes go in keyset chunks of 500 by primary key; each chunk asks the `HoldRegistry` with `Disposal.Retention`
  and the registered subject links, and a held row stays (counted as `held`). Archiving and soft-deleting keep the row
  and ask no hold. Every statement reaches the `NativeWriteWatcher`.
- Per-scope tightening of a default ("a tenant may change a default within bounds") is not built yet.

## System fields and validation on flush

Every `CrudService` write (`create`, `insert`, `insertMany`, `upsert`, `update`, `updateWhere`) refuses data that
sets a system field of the model, `SYSTEM_FIELDS` of `@stackra/model` by its traits, with `SystemFieldWriteError`
(`system_field_write`, 400): stamps come from the actor, the version from the optimistic lock (pass the caller's as
`expectedVersion`), the delete markers from `delete`/`restore`. A create may mint the id of the new row; an upsert may
also name its `by` fields.

A model with `ValidateOnFlush` has each created or changed row encoded through its generated `X$` by
`ValidateOnFlushSubscriber` before the flush writes it; a failure refuses the flush with `ModelInvalidError`
(`model_invalid`, the issues as `path: message`). The generated boot adds the subscriber; a model with the trait and no
registered schema throws at flush. Native statements (`updateWhere`, `increment`) write no entity and are not checked.

## Native writes and the change feed

`increment`, `delete` (soft and archive), `restore`, `repath` and `purge` write with a native statement, which fires no
flush event. When a `NativeWriteWatcher` is connected (`connectNativeWriteWatcher(writer)`, the boot passes
@stackra/outbox's `OutboxWriterService`) and it `watches(Model)`, the verb first reads the matching ids, narrows its
statement to them and reports `{ model, kind, ids, fields }` after it, inside the same transaction, so the outbox change
feed sees the rows. A model nobody watches is written exactly as before (one statement, no read). Raw SQL a service
writes itself is never reported.

## Entity cache

A model with `Cached({ ttl })` (@stackra/model) is read through the shared `Cache` by `findOne` and `findOneOrFail`
when the read is `{ id }` alone, with no option, no visibility condition and no running transaction (a writer always
reads the row fresh). The entry sits in the shared cache namespace under
`CacheKey.of(Model, id, scopeId, scopeNodeId)` for `ttl`, through MikroORM's result cache
(`EntityResultCacheAdapter`, set by `PostgresDatabaseDriver`), so a hit is hydrated into the unit of work like a read. A
miss is remembered too. A cache outage reads the database. `CacheInvalidationService` is the outbox change consumer that
forgets `CacheKey.of(Model, id)` after every committed change of the row, from any writer; gen registers it against each
`Cached` model with `registerChangeConsumers`. A `Cached` model may not have encrypted fields. Lists and filtered reads
stay on the database (cache them with a query's `cache` option).

## Legal holds

Every delete, purge and retention path consults one `HoldRegistry` (ADR 0134, 2026-10-24 amendment), which the
compliance service implements; it follows a hold across links to other services' records and logs each refused
attempt. Gen's boot connects the bound registry and registers the subscriber, as below:

```ts
connectHoldRegistry(container.get(HoldRegistry));
const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new HoldSubscriber()] });
```

- `em.remove(row)` of a held row: the flush is refused with `RecordHeldError` (`failed_precondition`).
- `CrudService.purge(where)`: removes only the matching rows no hold covers and counts those.
- A retention job: `disposableIds(Model, ids, Disposal.Retention)` before it purges.
- An edit a hold freezes (a comment kept with its revisions): `disposableIds(Model, [id], Disposal.Edit)` before it
  writes.

A model declares its subject links once at boot, so a hold on the linked person or matter reaches its rows; every
disposal path then sends each row's link values (`HoldLinks`) with its id:

```ts
registerHoldLinks([[Order, ["customerId"]]]);
```

Every service but the holds keeper binds the service-backed registry over its generated client (STA-1241):

```ts
container.bind(HoldChannel, ClientHoldChannelDriver); // the service's driver over `holds.hold.check@1`
container.bind(HoldRegistry, ServiceHoldRegistryDriver); // from @stackra/database/node
```

With no registry connected nothing is held. A soft delete keeps the row and is not a disposal.

## Arabic collation

A migration creates an ICU collation in its module's schema and collates a text column by it, so the column sorts in
Arabic letter order with digits by value. The locale is the migration's literal, from the market pack it serves:

```ts
schema.createCollation("arabic", "ar-u-kn-true");
schema.create("parties", (t) => {
  t.string("name", 200).notNull().collate("arabic").comment("The party's name.");
});
```

## Health check

`DatabaseHealthIndicatorDriver` (`./node`) is this package's `HealthIndicator` driver, named `database`: it runs `select 1`. The configuration is `DatabaseConfig` (key `database`, exported with `DatabaseConfig$` and `DatabaseConfigOptions` from `.`), which holds `health`, `timeouts` and `pool`; the connection URL is the Encore database's, handed over by the generated boot. Bind it and
`@stackra/app`'s `/readyz` runs it with the other bound indicators. `health` in this package's config tunes it:

| Field      | Default | Meaning                                                                   |
| ---------- | ------- | ------------------------------------------------------------------------- |
| `timeout`  | `PT2S`  | How long the probe may take before it counts as failed.                   |
| `critical` | `true`  | A failed probe is `down` and fails `/readyz`; `false` reports `degraded`. |

A failed probe never throws; its detail names the error type only.

## Session timeouts

`timeouts` in the same config are the timeouts every runtime session starts with. The boot passes them to
`PostgresDatabaseDriver.connect({ url, timeouts })`, which adds them to the primary and replica connection strings as
the Postgres startup `options` parameter:

| Field               | Default | Postgres setting                      |
| ------------------- | ------- | ------------------------------------- |
| `statement`         | `PT30S` | `statement_timeout`                   |
| `lock`              | `PT10S` | `lock_timeout`                        |
| `idleInTransaction` | `PT60S` | `idle_in_transaction_session_timeout` |

Runway's `config.database` layer sets them per environment. An action that runs longer, or must fail faster, declares
`timeout: Duration.minutes(2)` in `Action({...})`; `DatabaseUnitOfWorkDriver` passes it to
`Database.transaction(work, { timeout })`, which runs `set local statement_timeout` first, so it lasts until the
outermost transaction ends. The migration runner keeps its own session timeouts.

## Connection pool

`pool` in the same config is the connection pool of one instance (ADR 0473), passed by the boot as
`PostgresDatabaseDriver.connect({ url, pool })` and used for the primary and each replica:

| Field         | Default | Meaning                                            |
| ------------- | ------- | -------------------------------------------------- |
| `max`         | `10`    | The most connections this instance opens           |
| `min`         | `0`     | The connections kept open while idle               |
| `idleTimeout` | `PT10S` | How long an idle connection above `min` stays open |

The service's runway `database.poolBudget` is the connections all its instances may hold together. The deploy hands
each instance its share as `DATABASE_POOL_MAX` (`poolMaxOf` in `@stackra/runway`: the budget divided by the group's
`instances.max`), and the generated boot puts it over `pool.max`.

In production the runtime URL goes through the cloud's managed proxy (RDS Proxy on AWS, the Cloud SQL connector on
GCP). Tools that hold session state (the migration and seed runners: a session advisory lock and session `SET`) read
`directDatabaseUrl()` from `./node` instead: `DATABASE_DIRECT_URL`, the server itself, or `DATABASE_URL` when no proxy
stands in front (local, test containers).

## Connection placement

`ConnectionResolver` (`./contracts`) names the connection set (a cell: a primary and its replicas) that serves a
scope's work, so a `Database` driver can pick the connection before the transaction opens (ADR 0088 decision 3,
stackra-310). The free `PrimaryConnectionResolverDriver` (`./node`) answers `PRIMARY_CONNECTION` for every scope: one
region, one pool. `@stackra/tenancy` answers from the tenant's placement. The routing `Database` driver that opens one
connection set per name, and the per-cell fan-out of migrations, relay and queues, are stackra-322.

`region` in the same config is the runway region key of the deployment (`eu`, `me`); runway's `config.database` layer
sets it per stack. `@stackra/tenancy`'s `RegionGuardDriver` refuses a call whose tenant is placed in another region.

## Testing

Two tiers, one API. The unit tier (`.test.ts`) runs on `MemoryDatabaseDriver`: real Postgres compiled to WASM
([PGlite](https://pglite.dev)) in the test process, the `memory` driver of the `Database` port (ADR 0266, memory first).
The integration tier (`.int.test.ts`) runs on a Testcontainers Postgres through `usePostgres()`.

`assertRowSecurity(database, { column, setting, role, probe })` checks a migrated database: every table holding
`column` has row-level security enabled and forced with the policy `pol_<table>_<column>`, `role` is neither a
superuser nor BYPASSRLS (created `NOLOGIN NOBYPASSRLS` when missing), and a probe as `role` with `setting` at
`probe[0]` sees no other owner's row and cannot move one to `probe[1]`, inside a rolled-back transaction. It throws
one error listing every gap (stackra-258). `@stackra/tenancy/testing`'s `tenantIsolationOptions()` gives the tenant
form; gen writes a service's `.stackra/tests/tenant-isolation.int.test.ts` with both.

```ts
import { createTestingModule } from "@stackra/container/testing";
import { Factory, type Faker, usePostgres } from "@stackra/database/testing";

// unit tier: each compiled testing module gets a fresh in-memory database
const app = await createTestingModule(CatalogueServiceModule).useDrivers("memory").compile();
const product = await ProductFactory.new().has(VariantFactory.new()).create();
expect(await app.repository(Product).count({})).toBe(1);

// integration tier
usePostgres(); // a Testcontainers Postgres for this .int.test.ts file
const order = await OrderFactory.new().paid().has(OrderLineFactory.new().count(2)).create();
```

- **Schema.** Before its first query the memory database creates the approved extensions PGlite ships (`ltree`,
  `pg_trgm`, `citext`, `pgcrypto`; not `vector`) and applies the member's compiled migrations from
  `.stackra/migrations` under the working directory; a member with none gets the schema created from the registered
  entities.
- **Which database.** `DATABASE_TESTING_PLUGIN` connects a fresh memory database on every compile unless another one is
  connected: `usePostgres()` (connected before the module compiles) or a driver the container built for the module
  wins. The memory database an earlier module left is closed.
- **`app.repository(Model)`** is the model's `Repository`, the `repositoryOf(Model)` binding when the wiring has one.
- **Limits.** PGlite is one connection: a `requiresNew` transaction shares the surrounding session, and tests of
  concurrent sessions, row-level security under an unprivileged role, or vector columns stay in the integration tier.

Faker, Testcontainers, PGlite (`@electric-sql/pglite`) and `@mikro-orm/pglite` are optional peers of `./testing`; a
server never loads them.
