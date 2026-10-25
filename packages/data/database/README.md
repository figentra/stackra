# @stackra/database

The MikroORM layer of Stackra on Postgres: `CrudService<M>` with resource-table and metrics reads, repositories, the
graph reader, the `Migration`, `Macro` and `Seeder` kinds with the migration compiler, the `idx_`/`fk_`/`ck_` naming
strategy, the unit of work and scope sessions, gapless `Sequence` numbers, the record-visibility filter seam, and the
`Factory` and `usePostgres` test helpers.

**Tier:** `tier:lib` (`packages/data/database`), entries `.`, `./contracts`, `./node` and `./testing` (the template's old `./orm` is folded into
`.`). The only package that imports `@mikro-orm/*` (ADR 0097). Server only: no ORM on a client (ADR 0227, 0256).

## Entry points

| Import                        | Holds                          | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/database`           | `src/core/`: node runtime      | `CrudService`, `Repository` (t), `repositoryOf`, `GraphQuery`, `Aggregate`, `MixedCurrencyError`, `Migration`, `MigrationId` (t), `Macro`, `Seeder`, `Blueprint` (t), `SchemaBuilder` (t), `ColumnGroup` (t), `RowLevelSecurityOptions` (t), `Extension`, `compileMigration`, `table`, `sql`, `operationAction`, `operationQuery`, `Database`, `StackraNamingStrategy`, `registerEntities`, `registerModelPartners`, `EntitySchema`, `OptionalProps`, `UniqueViolation`; sequences: `Sequence`, `SequenceService`, `registerSequences`, `formatSequenceNumber`, `SequenceNotReservableError`, `SequenceBlockClosedError`, `SequenceNumberOutOfOrderError`, `SequenceOptions` (t), `SequenceClass` (t), `SequenceRegistration` (t), `SequenceSeries` (t), `SequenceNumber` (t), `SequenceBlock` (t), `SequenceReserveOptions` (t); visibility: `connectVisibilityFilter` |
| `@stackra/database/contracts` | `src/contracts/`: node runtime | `VisibilityFilter`, `Where` (t)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `@stackra/database/node`      | `src/node/`: node runtime      | `PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver`, `migrate`, `rollback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `@stackra/database/testing`   | `src/testing/`: tests only     | `Factory`, `Faker` (t), `usePostgres`, `DATABASE_TESTING_PLUGIN` (adds `.seed(...)` and `app.transaction(...)` to the testing module)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

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
  ran an earlier scope sees nothing. A blueprint takes one policy: Postgres ORs permissive policies.
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
  numbers only in its granted scopes. The year of a yearly sequence is read in the time zone the caller passes.

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

## Testing

```ts
import { Factory, type Faker, usePostgres } from "@stackra/database/testing";

usePostgres(); // a Testcontainers Postgres for this .int.test.ts file
const order = await OrderFactory.new().paid().has(OrderLineFactory.new().count(2)).create();
```

Faker and Testcontainers are optional peers of `./testing`; a server never loads them.
