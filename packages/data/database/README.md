# @stackra/database

The MikroORM layer of Stackra on Postgres: `CrudService<M>` with resource-table and metrics reads, repositories, the
graph reader, the `Migration`, `Macro` and `Seeder` kinds with the migration compiler, the `idx_`/`fk_`/`ck_` naming
strategy, the unit of work and scope sessions, and the `Factory` and `usePostgres` test helpers.

**Tier:** `tier:lib` (`packages/data/database`), entries `.` and `./testing` (the template's old `./orm` is folded into
`.`). The only package that imports `@mikro-orm/*` (ADR 0097). Server only: no ORM on a client (ADR 0227, 0256).

## Entry points

| Import                      | Holds                      | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/database`         | `src/core/`: node runtime  | `CrudService`, `Repository` (t), `repositoryOf`, `GraphQuery`, `Aggregate`, `MixedCurrencyError`, `Migration`, `MigrationId` (t), `Macro`, `Seeder`, `Blueprint` (t), `SchemaBuilder` (t), `ColumnGroup` (t), `Extension`, `compileMigration`, `table`, `sql`, `operationAction`, `operationQuery`, `Database`, `PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver`, `StackraNamingStrategy`, `registerEntities`, `registerModelPartners`, `EntitySchema`, `OptionalProps`, `UniqueViolation` |
| `@stackra/database/testing` | `src/testing/`: tests only | `Factory`, `Faker` (t), `usePostgres`, `DATABASE_TESTING_PLUGIN` (adds `.seed(...)` and `app.transaction(...)` to the testing module)                                                                                                                                                                                                                                                                                                                                                          |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` and `src/testing/index.ts` are stand-in barrels.

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
merges into `Blueprint` (gen writes the type) and is installed by name; `t.rowLevelSecurity(level)` writes the
enable, force and equality policy a scope-owning package's macro needs (ADR 0239).

## Scope isolation

`Database.withScope(scopeRef, work)` runs work in a transaction whose setting `app.<level>_id` holds the scope's id,
which every compiled policy compares with; a contracts `ScopeRef` names the level, so this package names none.

## Testing

```ts
import { Factory, type Faker, usePostgres } from "@stackra/database/testing";

usePostgres(); // a Testcontainers Postgres for this .int.test.ts file
const order = await OrderFactory.new().paid().has(OrderLineFactory.new().count(2)).create();
```

Faker and Testcontainers are optional peers of `./testing`; a server never loads them.
