/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/database` (with the
 *          old `./orm` folded in) and the registry row's runtime are exported, nothing else is, the internals are not,
 *          and the template's call shapes compile against it: a migration with a merged macro, a seeder, `CrudService`
 *          subclasses (`find` with `$in` and `populate`, `create` with nested lines, `table`, `metrics`, `$raw` with
 *          `sql` and a table constant), repositories (`insert` with `requiresNew`, `purge`, `sum`), the graph reader,
 *          the generated operations, entities with `[OptionalProps]`, and typed migration ids. The sequence,
 *          visibility and legal-hold symbols have their own tests beside them.
 * Boundary: test only; the template shapes are type-checked and constructed, never run against a database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0022; ADR 0269.
 */
import type { Period } from "@stackra/actions";
import type { PublicId } from "@stackra/contracts";
import { SortDirection } from "@stackra/contracts";
import { Collection, HasPublicId, ManyToOne, Model, OneToMany, Timestamps } from "@stackra/model";
import type { Link, Ref } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as database from "#core/index";
import {
  Aggregate,
  CrudService,
  EntitySchema,
  Macro,
  Migration,
  Seeder,
  UniqueViolation,
  operationAction,
  operationQuery,
  repositoryOf,
  sql,
  table,
} from "#core/index";
import type {
  Blueprint,
  ColumnGroup,
  MetricSeries,
  MetricValue,
  MigrationId,
  Repository,
  SchemaBuilder,
  TablePage,
  GraphQuery,
  OptionalProps,
} from "#core/index";

declare module "@stackra/database" {
  // oxlint-disable-next-line eslint/no-shadow -- reason: a module augmentation must repeat the interface's name
  interface Blueprint {
    /** Merged the way gen's `blueprint.d.ts` merges a package's macro. */
    dataClassification(column: string): ColumnGroup;
  }
}

class Variant extends Model.with(HasPublicId("var")) {
  sku!: string;

  trackInventory = true;
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the generated [OptionalProps] augmentation below
class Order extends Model.with(HasPublicId("ord"), Timestamps) {
  @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
  lines = new Collection<OrderLine>(this);

  customerId!: PublicId<"usr">;

  status: "pending_payment" | "paid" = "pending_payment";

  totalMinor = 0;

  paidAt: Date | null = null;
}

// The generated `[OptionalProps]` augmentation, as `.stackra/gen/entities/orders.ts` writes it.
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
interface Order {
  [OptionalProps]?: "id" | "createdAt" | "updatedAt" | "status" | "totalMinor" | "paidAt";
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the generated [OptionalProps] augmentation below
class OrderLine extends Model.with(HasPublicId("oln")) {
  @ManyToOne(() => Order)
  order!: Ref<Order>;

  @ManyToOne(() => Variant)
  variant!: Link<Variant>;

  quantity = 1;
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
interface OrderLine {
  [OptionalProps]?: "id" | "quantity";
}

class OrderService extends CrudService<Order> {
  findStale(cutoff: Date, limit: number): Promise<Order[]> {
    return this.find(
      { status: "pending_payment", createdAt: { $lt: cutoff } },
      { limit, orderBy: { createdAt: SortDirection.Asc }, populate: ["lines"] },
    );
  }

  createPending(customerId: PublicId<"usr">, variant: PublicId<"var">): Order {
    return this.create({ customerId, lines: [{ variant, quantity: 2 }] });
  }

  findCheap(ids: readonly PublicId<"ord">[]): Promise<Order[]> {
    return this.find({ id: { $in: [...ids] }, $raw: sql`${Orders.columns.totalMinor} < ${100}` });
  }
}

const Orders = table("orders.orders", { id: "id", totalMinor: "total_minor" });

class CreateAccessLogEntriesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("access_log_entries", (t: Blueprint) => {
      t.hasPublicId("acl");
      t.dataClassification("classification").notNull().comment("How sensitive the read was.");
      t.timestamp("at").notNull().index().comment("When the read happened.");
    });
  }
}

class DataClassificationMacro extends Macro {
  apply(t: Blueprint, column: string): ColumnGroup {
    return t.group(t.enum(column, ["personal", "financial", "health", "pseudonymous"]));
  }
}

class OrdersDemoSeeder extends Seeder {
  static readonly ids = { pending: "ord_01JA0000000000000000000003" } as const;

  async run(): Promise<void> {
    await Promise.resolve(OrdersDemoSeeder.ids.pending);
  }
}

/** The template's repository, graph and metrics calls; type-checked only. */
async function shapes(
  orders: OrderService,
  lines: Repository<OrderLine>,
  graph: GraphQuery,
  period: Period,
): Promise<void> {
  const page = await orders.table(
    { limit: 20, sort: { key: "createdAt", direction: SortDirection.Desc } },
    { where: { customerId: "usr_1" }, populate: ["lines"] },
  );
  expectTypeOf(page).toExtend<TablePage<Order>>();
  const paid = orders.metrics(period, { on: "paidAt", where: { status: "paid" } });
  expectTypeOf(await paid.sum("totalMinor")).toEqualTypeOf<MetricValue>();
  expectTypeOf(await paid.series(Aggregate.Count)).toEqualTypeOf<MetricSeries>();
  expectTypeOf(await lines.sum("quantity", { quantity: { $gte: 1 } })).toEqualTypeOf<number>();
  expectTypeOf(await lines.purge({ quantity: 0 })).toEqualTypeOf<number>();
  try {
    await lines.insert({ order: "ord_1", variant: "var_1" }, { requiresNew: true });
  } catch (error) {
    if (!(error instanceof UniqueViolation)) throw error;
  }
  const rows = await graph.through(OrderLine, "variant", {
    where: { quantity: { $gt: 0 } },
    fields: { line: ["variant", "quantity"], variant: ["sku", "trackInventory"] },
    limit: 100,
  });
  expectTypeOf(rows[0]?.variant.sku).toEqualTypeOf<string | undefined>();
  expectTypeOf(rows[0]?.line.quantity).toEqualTypeOf<number | undefined>();
}

describe("@stackra/database", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(database).sort()).toEqual([
      "Aggregate",
      "CrudService",
      "Database",
      "EntitySchema",
      "Extension",
      "GraphQuery",
      "HoldSubscriber",
      "Macro",
      "Migration",
      "MixedCurrencyError",
      "OptionalProps",
      "Projection",
      "RecordHeldError",
      "Seeder",
      "Sequence",
      "SequenceBlockClosedError",
      "SequenceNotReservableError",
      "SequenceNumberOutOfOrderError",
      "SequenceService",
      "StackraNamingStrategy",
      "UniqueViolation",
      "ancestorOf",
      "compileMigration",
      "connectHoldRegistry",
      "connectSequenceTimeZone",
      "connectVisibilityFilter",
      "descendantOf",
      "disposableIds",
      "formatSequenceNumber",
      "jsonContains",
      "jsonPath",
      "operationAction",
      "operationQuery",
      "registerEntities",
      "registerHoldLinks",
      "registerModelPartners",
      "registerSequences",
      "repositoryOf",
      "sql",
      "table",
      "visibleKeysQuery",
    ]);
    for (const internal of [
      "BlueprintRecord",
      "SchemaRecord",
      "ACTIVE_DATABASE",
      "modelOf",
      "SEQUENCE_REGISTRY",
      "VISIBILITY_HOST",
      "HOLD_HOST",
      "HOLD_LINK_FIELDS",
      "holdLinksOf",
      "visibleFilter",
      "mintSequenceBlockId",
      "CreateSequenceTablesMigration",
    ])
      expect(internal in database).toBe(false);
  });

  it("compiles the template's shapes", () => {
    const OrderSchema = new EntitySchema<Order>({
      class: Order,
      schema: "orders",
      tableName: "orders",
      properties: {
        id: { type: "string", primary: true, columnType: "varchar(33)" },
        createdAt: { type: "datetime" },
        updatedAt: { type: "datetime" },
        customerId: { type: "string", columnType: "varchar(30)" },
        status: { enum: true, items: ["pending_payment", "paid"], default: "pending_payment" },
        totalMinor: { type: "integer", default: 0 },
        paidAt: { type: "datetime", nullable: true, default: null },
        lines: { kind: "1:m", entity: () => OrderLine, mappedBy: "order" },
      },
    });
    const migrations = {
      orders: { createOrders: "orders.0001_create_orders" as MigrationId },
    } as const;
    const List = operationQuery(Order, "list", { service: OrderService, permission: "read" });
    const Create = operationAction(Order, "create", {
      service: OrderService,
      permission: "create",
    });
    expect(OrderSchema.meta.tableName).toBe("orders");
    expect(migrations.orders.createOrders).toBe("orders.0001_create_orders");
    expect([List.name, Create.name]).toEqual(["OrderListQuery", "OrderCreateAction"]);
    expect(repositoryOf(Variant)).toBe(repositoryOf(Variant));
    expect(new OrdersDemoSeeder()).toBeInstanceOf(Seeder);
    expect(new DataClassificationMacro()).toBeInstanceOf(Macro);
    expect(typeof CreateAccessLogEntriesMigration).toBe("function");
    expect(typeof shapes).toBe("function");
    expectTypeOf<OrderService["findStale"]>().returns.resolves.toEqualTypeOf<Order[]>();
    expectTypeOf<OrderService["findCheap"]>().returns.resolves.toEqualTypeOf<Order[]>();
    expectTypeOf<OrderService["createPending"]>().returns.toEqualTypeOf<Order>();
  });
});
