# @stackra/database

The MikroORM layer of Stackra on Postgres: `CrudService<M>` with resource-table and metrics reads, repositories, the
graph reader, the `Migration`, `Macro` and `Seeder` kinds with the migration compiler, the `idx_`/`fk_`/`ck_` naming
strategy, the unit of work and scope sessions, gapless `Sequence` numbers, `Projection` read models with `asOf` reads, the record-visibility filter seam, and the
`Factory` and `usePostgres` test helpers.

**Tier:** `tier:lib` (`packages/data/database`), entries `.`, `./contracts`, `./node` and `./testing` (the template's old `./orm` is folded into
`.`). The only package that imports `@mikro-orm/*` (ADR 0097). Server only: no ORM on a client (ADR 0227, 0256).

## Entry points

| Import                        | Holds                          | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/database`           | `src/core/`: node runtime      | `CrudService`, `Repository` (t), `repositoryOf`, `GraphQuery`, `Aggregate`, `MixedCurrencyError`, `Migration`, `MigrationId` (t), `Macro`, `Seeder`, `Blueprint` (t), `SchemaBuilder` (t), `ColumnGroup` (t), `RowLevelSecurityOptions` (t), `Extension`, `compileMigration`, `table`, `sql`, `operationAction`, `operationQuery`, `Database`, `StackraNamingStrategy`, `registerEntities`, `registerModelPartners`, `EntitySchema`, `OptionalProps`, `UniqueViolation`; sequences: `Sequence`, `SequenceService`, `registerSequences`, `formatSequenceNumber`, `SequenceNotReservableError`, `SequenceBlockClosedError`, `SequenceNumberOutOfOrderError`, `SequenceOptions` (t), `SequenceClass` (t), `SequenceRegistration` (t), `SequenceSeries` (t), `SequenceNumber` (t), `SequenceBlock` (t), `SequenceReserveOptions` (t); visibility: `connectVisibilityFilter`; legal holds: `connectHoldRegistry`, `disposableIds`, `HoldSubscriber`, `RecordHeldError`; `connectSequenceTimeZone`; read models: `Projection`, `ProjectionClass` (t), `ProjectionOptions` (t), `ProjectionReadOptions` (t), `ProjectionRow` (t) |
| `@stackra/database/contracts` | `src/contracts/`: node runtime | `VisibilityFilter`, `HoldRegistry`, `Disposal`, `SequenceTimeZone`, `Where` (t)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `@stackra/database/node`      | `src/node/`: node runtime      | `PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver`, `PostgresIdempotencyStoreDriver`, `PostgresRateLimitStoreDriver`, `migrate`, `rollback`, `seedState`, `applySeed`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `@stackra/database/testing`   | `src/testing/`: tests only     | `Factory`, `Faker` (t), `usePostgres`, `DATABASE_TESTING_PLUGIN` (adds `.seed(...)` and `app.transaction(...)` to the testing module)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

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
```

- The model comes from the type argument (gen registers it with `registerModelPartners`); the entity manager is the
  running context's, so every write joins the action's unit of work (`DatabaseUnitOfWorkDriver`).
- `findOneOrFail` refuses with `not_found`; `insert` writes now and throws `UniqueViolation` without spoiling the
  caller's transaction; a money `sum` over two currencies refuses with `mixed_currency`.
- Raw SQL is one parameterised condition: `{ $raw: sql\`${StockLevels.columns.onHand} <= ${n}\` }`, with columns from
gen's `table(...)` constants (ADR 0160).

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
a new table, an extension outside ADR 0160's five, and a raw `schema.sql` without its `inverse`. A package's `Macro`
merges into `Blueprint` (gen writes the type) and is installed by name.

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
  none of them (ADR 0412).
- `service.repath(from, to)` (every `CrudService` over a model with `scopePath`) moves a scope subtree's rows: each
  path at or below `from` takes `to` in place of that prefix, in one statement in the caller's transaction. A service
  calls it from its listener of `@stackra/scope`'s `ScopeMoved`, in a scope that reaches both paths (ADR 0411).
- `Database.withScope(scope | scopes, work)` sets, for the transaction, `app.scope_id` and `app.scope_path` when one
  scope is given and `app.scope_paths` (every granted path joined by `|`) always; no granted scope means no rows. A
  path that is not an `ltree` path is refused.
- `t.scopeId()` and `t.scopePath()` are the scope-tree columns `@stackra/scope` and `@stackra/tenancy` build on;
  tenancy's `belongsToTenant` stays in tenancy.

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
connection is the member's `DATABASE_URL`, as for `stackra db migrate`, which runs first.

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

## Testing

```ts
import { Factory, type Faker, usePostgres } from "@stackra/database/testing";

usePostgres(); // a Testcontainers Postgres for this .int.test.ts file
const order = await OrderFactory.new().paid().has(OrderLineFactory.new().count(2)).create();
```

Faker and Testcontainers are optional peers of `./testing`; a server never loads them.
