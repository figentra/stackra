/**
 * Stackra file contract:
 * Purpose: unit tests of `compileMigration`: the SQL and inverses of the template's migration shapes (create with
 *          trait, money, bigint, decimal, enum, link and foreign-key columns; the AppendOnly revoke; expand steps; online indexes; raw statements with `after`),
 *          macros installed by name, the generated equality, equals-or-unset, ancestor and inherited row-level-security policies, the
 *          scope-tree columns with their GiST index, generated columns, and every safety refusal (missing nullability or comment,
 *          NOT NULL without a default, non-concurrent index on an existing table, concurrent index on a new one,
 *          unapproved extension, raw statement without an inverse, a policy the table cannot take), and the ICU
 *          collation of a text column (with its refusals), column changes on an existing table (nullable, NOT NULL,
 *          type with a stated `from`) with their inverses and refusals, and a foreign key or enum check on an existing
 *          table added NOT VALID and validated in its own step (stackra-251), and the `platformTable` and
 *          `reviewedPolicy` declarations: their marker lines, read back by `tableDeclarations`, and their refusals (an
 *          empty or multi-line reason, no policy named, a platform table with an owner column or a policy, two
 *          declarations), and the system-access mechanism (ADR 0239 amendment, gap A): `t.systemAccess`'s marker line,
 *          role, column grants and role-scoped policies, `schema.systemFunction`'s marker line, definer function with
 *          its pinned search path and its hand-over to the role, both read back by `tableDeclarations`, and their
 *          refusals.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (as amended); ADR 0160; ADR 0239; ADR 0327 (decisions 3 and 9);
 *                     `.agents/rules/tenancy.md`; ADR 0231; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { Macro } from "#core/bases/macro.base";
import { Migration } from "#core/bases/migration.base";
import { Extension } from "#core/enums/extension.enum";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { ColumnGroup } from "#core/types/column-group.type";
import type { MigrationId } from "#core/types/migration-id.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { tableDeclarations } from "#core/functions/table-declarations.function";

/** The compiled SQL of `type` in the `outbox` schema, as gen writes a migration file. */
const sqlOf = (type: Parameters<typeof compileMigration>[0]): string =>
  compileMigration(type, { schema: "outbox" })
    .steps.flatMap((step) => step.sql)
    .map((statement) => `${statement};\n`)
    .join("");

/** Compiling `define` on the existing `jobs` table, for a refusal. */
const refusal = (define: (t: Blueprint) => void) => {
  class AccessMigration extends Migration {
    up(schema: SchemaBuilder): void {
      schema.table("jobs", define);
    }
  }
  return () => sqlOf(AccessMigration);
};

/** An id column with its equality policy, the way an isolation package's macro writes one. */
class BelongsToWorkspaceMacro extends Macro {
  apply(t: Blueprint): ColumnGroup {
    const group = t.group(t.uuid("workspace_id").notNull().comment("The owning workspace."));
    t.rowLevelSecurity("workspace_id", { setting: "app.workspace_id", match: "equals" });
    return group;
  }
}

/** A one-column convention with a parameter, like the template's data-classification macro. */
class DataClassificationMacro extends Macro {
  apply(t: Blueprint, column: string): ColumnGroup {
    return t.group(t.enum(column, ["personal", "financial"]));
  }
}

/** The macro methods the fixtures call, typed the way gen's `blueprint.d.ts` merge types them. */
type WithMacros = Blueprint & {
  belongsToWorkspace: () => ColumnGroup;
  dataClassification: (column: string) => ColumnGroup;
};

const macros = [BelongsToWorkspaceMacro, DataClassificationMacro];

/** The reviewed squawk ignore above a SET NOT NULL a whole-table pre-flight vouched for (STA-2612). */
const REFUSED_NOT_NULL =
  "-- lint: contract step after the expand phase; the pre-flight above refused any NULL, the table is pre-production, and the step runs once (ADR 0239).\n" +
  "-- squawk-ignore adding-not-nullable-field\n";

class CreateOrdersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("orders", (blueprint: Blueprint) => {
      const t = blueprint as WithMacros;
      t.hasPublicId("ord");
      t.belongsToWorkspace();
      t.timestamps();
      t.userStamps();
      t.versioned();
      t.string("customer_id", 30).notNull().comment("The customer who placed it.");
      t.enum("status", ["pending_payment", "paid"])
        .notNull()
        .default("pending_payment")
        .comment("Lifecycle; written only by the state machine.");
      t.money("total").notNull().comment("Amount charged.");
      t.jsonb("adjustments").notNull().default([]).comment("Applied adjustments.");
      t.string("payment_id", 64).nullable().comment("The payment, once authorized.");
      t.index(["workspace_id", "status"]);
    });
    schema.create("order_lines", (t: Blueprint) => {
      t.hasPublicId("oln");
      t.belongsTo("orders", { column: "order_id" })
        .notNull()
        .cascadeOnDelete()
        .comment("The owning order.");
      t.link("variant_id").notNull().comment("The catalogue variant sold.");
      t.integer("quantity").notNull().comment("Units ordered.");
    });
  }
}

/** The compiled migration of `define` on the existing `jobs` table. */
function compiledOn(define: (t: Blueprint) => void) {
  class ContractMigration extends Migration {
    up(schema: SchemaBuilder): void {
      schema.table("jobs", define);
    }
  }
  return compileMigration(ContractMigration, { schema: "outbox" });
}

/** The compiled migration of `up` on the `outbox` schema. */
function compiledSchema(up: (schema: SchemaBuilder) => void) {
  class SchemaMigration extends Migration {
    up(schema: SchemaBuilder): void {
      up(schema);
    }
  }
  return compileMigration(SchemaMigration, { schema: "outbox" });
}

describe(compileMigration, () => {
  it("range-partitions a new table with a default partition, the column in the key and a BRIN index", () => {
    class CreateMeterEventsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("meter_events", (t: Blueprint) => {
          t.hasPublicId("mev");
          t.timestamp("occurred_at").notNull().comment("When the usage happened.");
          t.partitionBy("occurred_at");
        });
      }
    }
    const [step] = compileMigration(CreateMeterEventsMigration, { schema: "usage" }).steps;
    const sql = step?.sql ?? [];
    expect(sql[0]).toMatch(
      /primary key \("id", "occurred_at"\)\n\) partition by range \("occurred_at"\)$/,
    );
    expect(sql).toContain(
      'create table "usage"."meter_events_default" partition of "usage"."meter_events" default',
    );
    expect(sql.some((text) => text.includes('using brin ("occurred_at")'))).toBe(true);
  });

  it("writes one index for a link column the blueprint also makes unique", () => {
    class CreateLocationsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("locations", (t: Blueprint) => {
          t.hasPublicId("loc");
          t.link("scope_id").notNull().comment("The location's scope node.");
          t.link("group_id").nullable().comment("Its group.");
          t.unique(["scope_id"]);
        });
      }
    }
    const sql = compileMigration(CreateLocationsMigration, { schema: "entities" }).steps.flatMap(
      (step) => step.sql,
    );
    const onScope = sql.filter((text) => text.includes('"idx_locations_scope_id"'));
    expect(onScope).toHaveLength(1);
    expect(onScope[0]).toMatch(/^create unique index/);
    expect(sql.filter((text) => text.includes('"idx_locations_group_id"'))).toHaveLength(1);
  });

  it("refuses a partitioning Postgres would refuse", () => {
    class NullableMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("events", (t: Blueprint) => {
          t.hasPublicId("evt");
          t.timestamp("at").nullable().comment("When.");
          t.partitionBy("at");
        });
      }
    }
    expect(() => compileMigration(NullableMigration, { schema: "usage" })).toThrow("NOT NULL");
    class UniqueMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("events", (t: Blueprint) => {
          t.hasPublicId("evt");
          t.timestamp("at").notNull().comment("When.");
          t.string("ref", 20).notNull().comment("A reference.");
          t.unique(["ref"]);
          t.partitionBy("at");
        });
      }
    }
    expect(() => compileMigration(UniqueMigration, { schema: "usage" })).toThrow("includes at");
    class ExistingMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("events", (t: Blueprint) => t.partitionBy("at"));
      }
    }
    expect(() => compileMigration(ExistingMigration, { schema: "usage" })).toThrow(
      "only a new table",
    );
  });

  it("stores public-id keys as native uuid with publicIds: uuid, stamps staying text (ADR 0135, 2026-10-28)", () => {
    const [step] = compileMigration(CreateOrdersMigration, {
      schema: "orders",
      publicIds: "uuid",
      macros,
    }).steps;
    const sql = step?.sql.join("\n") ?? "";
    expect(sql).toContain('  "id" uuid not null,');
    expect(sql).toContain('  "created_by" varchar(33) null,');
    expect(sql).toMatch(/"order_id" uuid not null/);
    expect(sql).toMatch(/"variant_id" uuid not null/);
  });

  it("compiles a create migration to one transactional step with its inverse", () => {
    const { after, steps } = compileMigration(CreateOrdersMigration, {
      schema: "orders",
      createsSchema: true,
      macros,
    });
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    const [step] = steps;
    expect(step?.transactional).toBe(true);
    expect(step?.sql[0]).toBe('create schema if not exists "orders"');
    expect(step?.sql[1]).toBe(
      [
        'create table "orders"."orders" (',
        '  "id" varchar(33) not null,',
        '  "workspace_id" uuid not null,',
        '  "created_at" timestamptz default now() not null,',
        '  "updated_at" timestamptz default now() not null,',
        '  "created_by" varchar(33) null,',
        '  "updated_by" varchar(33) null,',
        '  "version" integer default 1 not null,',
        '  "customer_id" varchar(30) not null,',
        `  "status" text default 'pending_payment' not null constraint "ck_orders_status" check ("status" in ('pending_payment', 'paid')),`,
        '  "total_minor" bigint not null,',
        '  "total_currency" char(3) not null,',
        `  "adjustments" jsonb default '[]'::jsonb not null,`,
        '  "payment_id" varchar(64) null,',
        '  primary key ("id")',
        ")",
      ].join("\n"),
    );
    expect(step?.sql).toContain(
      `comment on column "orders"."orders"."total_minor" is 'Amount charged. (minor units)'`,
    );
    expect(step?.sql).toContain(
      'create index "idx_orders_workspace_id_status" on "orders"."orders" ("workspace_id", "status")',
    );
    expect(step?.sql).toContain('alter table "orders"."orders" force row level security');
    // A uuid column decodes a public-id setting and casts any other value; the int test runs it on Postgres.
    const policy = step?.sql.find((sql) =>
      sql.startsWith('create policy "pol_orders_workspace_id"'),
    );
    expect(policy).toContain(
      `using ("workspace_id" = (case when strpos(nullif(current_setting('app.workspace_id', true), ''), '_') > 0 then `,
    );
    expect(policy).toContain(
      `else nullif(current_setting('app.workspace_id', true), '') end)::uuid) with check ("workspace_id" = (case`,
    );
    expect(step?.sql).toContain(
      'alter table "orders"."order_lines" add constraint "fk_order_lines_order_id" foreign key ("order_id") references "orders"."orders" ("id") on delete cascade',
    );
    expect(step?.sql).toContain(
      'create index "idx_order_lines_variant_id" on "orders"."order_lines" ("variant_id")',
    );
    expect(step?.inverse).toEqual([
      'drop table if exists "orders"."order_lines"',
      'drop table if exists "orders"."orders"',
      'drop schema if exists "orders"',
    ]);
  });

  it("compiles an expand step and an online index as separate steps", () => {
    class AddPaidAtMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("orders", (t: Blueprint) => {
          t.timestamp("paid_at").nullable().comment("When the payment was captured.");
          t.index(["status", "paid_at"]).concurrently();
        });
      }
    }
    expect(compileMigration(AddPaidAtMigration, { schema: "orders" }).steps).toEqual([
      {
        sql: [
          'alter table "orders"."orders" add column "paid_at" timestamptz null',
          `comment on column "orders"."orders"."paid_at" is 'When the payment was captured.'`,
        ],
        transactional: true,
        inverse: ['alter table "orders"."orders" drop column if exists "paid_at"'],
      },
      {
        sql: [
          'create index concurrently "idx_orders_status_paid_at" on "orders"."orders" ("status", "paid_at")',
        ],
        transactional: false,
        inverse: ['drop index concurrently if exists "orders"."idx_orders_status_paid_at"'],
      },
    ]);
  });

  it("adds a foreign key and an enum check to an existing table NOT VALID, then validates each in its own step", () => {
    class AddReturnsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("order_lines", (t: Blueprint) => {
          t.belongsTo("returns", { column: "return_id" })
            .nullable()
            .withoutIndex()
            .comment("The return this line came back in.");
          t.enum("return_state", ["requested", "received"])
            .nullable()
            .comment("Where the return stands.");
        });
      }
    }
    const table = '"orders"."order_lines"';
    const steps = compileMigration(AddReturnsMigration, { schema: "orders" }).steps;
    expect(steps[0]?.sql).toContain(
      `alter table ${table} add constraint "fk_order_lines_return_id" foreign key ("return_id") references "orders"."returns" ("id") not valid`,
    );
    expect(steps[0]?.sql).toContain(`alter table ${table} add column "return_state" text null`);
    expect(steps[0]?.sql).toContain(
      `alter table ${table} add constraint "ck_order_lines_return_state" check ("return_state" in ('requested', 'received')) not valid`,
    );
    expect(steps.slice(1)).toEqual([
      {
        sql: [`alter table ${table} validate constraint "fk_order_lines_return_id"`],
        transactional: true,
        inverse: [],
      },
      {
        sql: [`alter table ${table} validate constraint "ck_order_lines_return_state"`],
        transactional: true,
        inverse: [],
      },
    ]);
  });

  it("keeps the enum check inline when the table is created", () => {
    class CreateReturnsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("returns", (t: Blueprint) => {
          t.enum("state", ["requested", "received"]).notNull().comment("Where the return stands.");
        });
      }
    }
    const steps = compileMigration(CreateReturnsMigration, { schema: "orders" }).steps;
    expect(steps).toHaveLength(1);
    expect(steps[0]?.sql.join("\n")).toContain(
      `constraint "ck_returns_state" check ("state" in ('requested', 'received'))`,
    );
    expect(steps[0]?.sql.join("\n")).not.toContain("not valid");
  });

  it("changes existing columns before the added ones, each with its inverse", () => {
    class LoosenBalancesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("balances", (t: Blueprint) => {
          t.change("member_id").nullable();
          t.change("points").type("bigint", { from: "integer" }).notNull();
          t.change("note").type("text", { from: "varchar(200)", using: 'trim("note")' });
          t.string("source", 32).nullable().comment("The system the balance was imported from.");
        });
      }
    }
    const table = '"loyalty"."balances"';
    expect(compileMigration(LoosenBalancesMigration, { schema: "loyalty" }).steps).toEqual([
      {
        sql: [
          `alter table ${table} alter column "member_id" drop not null`,
          `alter table ${table} alter column "points" type bigint using "points"::bigint`,
          `alter table ${table} alter column "points" set not null`,
          `alter table ${table} alter column "note" type text using trim("note")`,
          `alter table ${table} add column "source" varchar(32) null`,
          `comment on column ${table}."source" is 'The system the balance was imported from.'`,
        ],
        transactional: true,
        inverse: [
          `alter table ${table} drop column if exists "source"`,
          `alter table ${table} alter column "note" type varchar(200) using "note"::varchar(200)`,
          `alter table ${table} alter column "points" drop not null`,
          `alter table ${table} alter column "points" type integer using "points"::integer`,
          `alter table ${table} alter column "member_id" set not null`,
        ],
      },
    ]);
  });

  it("tells squawk that widening a varchar, or varchar to text, rewrites nothing, and flags every other type change", () => {
    class WidenProductsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("products", (t: Blueprint) => {
          t.change("sku").type("varchar(128)", { from: "varchar(64)" });
          t.change("title").type("text", { from: "varchar(200)" });
          t.change("code").type("varchar(16)", { from: "varchar(32)" });
          t.change("stock").type("bigint", { from: "integer" });
          t.change("note").type("text", { from: "varchar(200)", using: 'trim("note")' });
        });
      }
    }
    const [sql = []] = compileMigration(WidenProductsMigration, { schema: "catalogue" }).steps.map(
      (step) => step.sql,
    );
    const ignored = (column: string): boolean =>
      sql.some(
        (statement) =>
          statement.includes(`alter column "${column}" type`) &&
          statement.includes("-- squawk-ignore changing-column-type\n"),
      );
    // The two widenings: the reason line, then the ignore, right above the statement.
    expect(ignored("sku")).toBe(true);
    expect(ignored("title")).toBe(true);
    expect(sql.find((statement) => statement.includes(`"sku" type`))).toMatch(
      /^-- lint: widening a varchar[^\n]*\n-- squawk-ignore changing-column-type\nalter table/,
    );
    // Narrowing, another type, and a custom conversion stay flagged.
    expect(ignored("code")).toBe(false);
    expect(ignored("stock")).toBe(false);
    expect(ignored("note")).toBe(false);
  });

  it("gives an existing column a default read from a setting, which its inverse drops", () => {
    class StampPivotMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("product_tags", (t: Blueprint) =>
          t.change("tenant_id").defaultSetting("app.tenant_id"),
        );
      }
    }
    const table = '"catalogue"."product_tags"';
    expect(compileMigration(StampPivotMigration, { schema: "catalogue" }).steps).toEqual([
      {
        sql: [
          `alter table ${table} alter column "tenant_id" set default nullif(current_setting('app.tenant_id', true), '')`,
        ],
        transactional: true,
        inverse: [`alter table ${table} alter column "tenant_id" drop default`],
      },
    ]);
  });

  it.each([
    [
      "a setting default that is not a custom setting",
      "table",
      (t: Blueprint) => t.change("tenant_id").defaultSetting("tenant_id"),
      /is not a custom setting/,
    ],
    [
      "a second setting default of one column",
      "table",
      (t: Blueprint) =>
        t.change("tenant_id").defaultSetting("app.tenant_id").defaultSetting("app.owner_id"),
      /already changes its default/,
    ],
    [
      "a change on a table being created",
      "create",
      (t: Blueprint) => t.change("sku").nullable(),
      /define sku as it should be/,
    ],
    [
      "a change that changes nothing",
      "table",
      (t: Blueprint) => t.change("sku"),
      /changes nothing/,
    ],
    [
      "a column changed twice",
      "table",
      (t: Blueprint) => {
        t.change("sku").nullable();
        t.change("sku").type("text", { from: "varchar(64)" });
      },
      /already changed/,
    ],
    [
      "a second nullability on one change",
      "table",
      (t: Blueprint) => t.change("sku").nullable().notNull(),
      /already changes its nullability/,
    ],
    [
      "a type the blueprint does not write",
      "table",
      (t: Blueprint) => t.change("sku").type("varchar", { from: "text" }),
      /not a column type/,
    ],
    [
      "a type change to the same type",
      "table",
      (t: Blueprint) => t.change("sku").type("text", { from: "text" }),
      /already text/,
    ],
    [
      "a change of a column the blueprint adds",
      "table",
      (t: Blueprint) => {
        t.string("sku", 64).nullable().comment("The SKU.");
        t.change("sku").type("text", { from: "varchar(64)" });
      },
      /is added by this blueprint/,
    ],
  ])("refuses %s", (_name, verb, define, message) => {
    class BadMigration extends Migration {
      up(schema: SchemaBuilder): void {
        if (verb === "create") schema.create("products", define);
        else schema.table("products", define);
      }
    }
    expect(() => compileMigration(BadMigration, { schema: "catalogue" })).toThrow(message);
  });

  it("keeps after, puts each concurrent statement in its own step, and keeps a stated inverse", () => {
    const textFunctions = "search.0001_create_text_functions" as MigrationId;
    class ProductsSearchIndexMigration extends Migration({ after: [textFunctions] }) {
      up(schema: SchemaBuilder): void {
        schema.table("products", (t: Blueprint) => {
          t.index(["search_vector_en"]).using("gin").concurrently();
        });
        schema.sql(
          "CREATE INDEX CONCURRENTLY idx_products_search_text_trgm ON catalogue.products (x)",
          {
            inverse: "DROP INDEX CONCURRENTLY IF EXISTS catalogue.idx_products_search_text_trgm",
          },
        );
      }
    }
    const { after, steps } = compileMigration(ProductsSearchIndexMigration, {
      schema: "catalogue",
    });
    expect(after).toEqual([textFunctions]);
    expect(steps.map((step) => step.transactional)).toEqual([false, false]);
    expect(steps[0]?.sql).toEqual([
      'create index concurrently "idx_products_search_vector_en" on "catalogue"."products" using gin ("search_vector_en")',
    ]);
    expect(steps[1]?.inverse).toEqual([
      "DROP INDEX CONCURRENTLY IF EXISTS catalogue.idx_products_search_text_trgm",
    ]);
  });

  it("writes a partial unique index, a macro with parameters, an extension and a generated column", () => {
    class CreateAccountsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createExtension(Extension.Trigram);
        schema.create("accounts", (blueprint: Blueprint) => {
          const t = blueprint as WithMacros;
          t.hasPublicId("acc");
          t.softDeletes();
          t.archivable();
          t.string("member_id", 64).notNull().comment("The member.");
          t.dataClassification("classification").notNull().comment("How sensitive it is.");
          t.integer("points").notNull().default(0).comment("Points held.");
          t.integer("double_points").notNull().storedAs("points * 2").comment("Twice the points.");
          t.tsvector("search_vector").nullable().comment("The full-text document.");
          t.unique(["member_id"]).where("deleted_at is null");
        });
      }
    }
    const [step] = compileMigration(CreateAccountsMigration, { schema: "loyalty", macros }).steps;
    expect(step?.sql[0]).toBe('create extension if not exists "pg_trgm"');
    expect(step?.sql[1]).toContain(
      `"classification" text not null constraint "ck_accounts_classification" check ("classification" in ('personal', 'financial'))`,
    );
    expect(step?.sql[1]).toContain(
      '"double_points" integer generated always as (points * 2) stored not null',
    );
    expect(step?.sql[1]).toContain('"search_vector" tsvector null');
    expect(step?.sql[1]).toContain('"archived_at" timestamptz null');
    expect(step?.sql).toContain(
      'create unique index "idx_accounts_member_id" on "loyalty"."accounts" ("member_id") where deleted_at is null',
    );
    // The extension is shared by every module, so the down keeps it (STA-1689).
    expect(step?.inverse).toEqual(['drop table if exists "loyalty"."accounts"']);
  });

  it("revokes update on an append-only table, created or existing (stackra-256)", () => {
    class CreateEntriesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("entries", (t: Blueprint) => {
          t.hasPublicId("lpe");
          t.appendOnly();
        });
        schema.table("journals", (t: Blueprint) => {
          t.appendOnly();
        });
      }
    }
    const [step] = compileMigration(CreateEntriesMigration, { schema: "ledger" }).steps;
    expect(step?.sql).toContain('revoke update on "ledger"."entries" from public, current_user');
    expect(step?.sql).toContain('revoke update on "ledger"."journals" from public, current_user');
    expect(step?.inverse).toContain('grant update on "ledger"."entries" to current_user');
    expect(step?.inverse).toContain('grant update on "ledger"."journals" to current_user');
  });

  it("writes bigint and exact decimal columns (STA-1240)", () => {
    class CreateReadingsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("readings", (t: Blueprint) => {
          t.bigint("amount_minor").notNull().comment("Amount in minor units.");
          t.decimal("value", 12, 4).notNull().comment("The measured value.");
        });
      }
    }
    const [step] = compileMigration(CreateReadingsMigration, { schema: "meters" }).steps;
    expect(step?.sql.join("\n")).toContain('"amount_minor" bigint not null');
    expect(step?.sql.join("\n")).toContain('"value" numeric(12, 4) not null');
  });

  it.each([
    ["a precision of 0", 0, 0],
    ["a precision past 1000", 1001, 2],
    ["a scale past the precision", 4, 5],
    ["a negative scale", 4, -1],
    ["a fractional precision", 4.5, 1],
  ])("refuses a decimal with %s", (_name, precision, scale) => {
    class BadDecimalMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("readings", (t: Blueprint) => {
          t.decimal("value", precision, scale).notNull().comment("The measured value.");
        });
      }
    }
    expect(() => compileMigration(BadDecimalMigration, { schema: "meters" })).toThrow(RangeError);
  });

  it("marks a step irreversible when a raw statement says so", () => {
    class TriggerMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.sql("create function app.refuse_update() returns trigger as $$ begin end $$", {
          inverse: false,
        });
      }
    }
    expect(compileMigration(TriggerMigration, { schema: "app" }).steps[0]?.inverse).toBe(false);
  });

  it("adds the row-level-security policy to an existing table with its inverse", () => {
    class ScopeMessagesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("messages", (t: Blueprint) => {
          t.uuid("workspace_id").nullable().comment("The owning workspace.");
          t.rowLevelSecurity("workspace_id", { setting: "app.workspace_id", match: "equals" });
        });
      }
    }
    const [step] = compileMigration(ScopeMessagesMigration, { schema: "messages" }).steps;
    expect(step?.inverse).toEqual([
      'drop policy if exists "pol_messages_workspace_id" on "messages"."messages"',
      'alter table "messages"."messages" no force row level security',
      'alter table "messages"."messages" disable row level security',
      'alter table "messages"."messages" drop column if exists "workspace_id"',
    ]);
  });

  it("writes the equalsOrUnset policy: null rows match an unset setting (STA-1300)", () => {
    class CreatePlansMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("plans", (t: Blueprint) => {
          t.scopeId().nullable().comment("The scope node; null for a platform row.");
          t.rowLevelSecurity("scope_id", { setting: "app.scope_id", match: "equalsOrUnset" });
        });
      }
    }
    const [step] = compileMigration(CreatePlansMigration, { schema: "plans" }).steps;
    const check = `"scope_id" is not distinct from nullif(current_setting('app.scope_id', true), '')::varchar(33)`;
    expect(step?.sql).toContain(
      `create policy "pol_plans_scope_id" on "plans"."plans" using (${check}) with check (${check})`,
    );
  });

  it("defaults a column to a setting, null while it is unset, and refuses one on a uuid column", () => {
    class AddWorkspaceMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("plans", (t: Blueprint) => {
          t.link("workspace_id")
            .nullable()
            .defaultSetting("app.workspace_id")
            .comment("The workspace.");
        });
      }
    }
    const [step] = compileMigration(AddWorkspaceMigration, { schema: "plans" }).steps;
    expect(step?.sql).toContain(
      "-- lint: current_setting() is STABLE, so Postgres 11+ adds this column without rewriting the table.\n" +
        "-- squawk-ignore adding-field-with-default\n" +
        `alter table "plans"."plans" add column "workspace_id" varchar(33) default nullif(current_setting('app.workspace_id', true), '')::varchar(33) null`,
    );
    expect(() =>
      compileMigration(AddWorkspaceMigration, { schema: "plans", publicIds: "uuid" }),
    ).toThrow("workspace_id is uuid, so it takes no setting default");
    class BadSettingMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("plans", (t: Blueprint) => {
          t.link("workspace_id").nullable().defaultSetting("workspace").comment("The workspace.");
        });
      }
    }
    expect(() => compileMigration(BadSettingMigration, { schema: "plans" })).toThrow(
      '"workspace" is not a custom setting',
    );
  });

  it("creates an ICU collation in the module schema and collates a text column by it", () => {
    class CreatePartiesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createCollation("arabic", "ar-u-kn-true");
        schema.create("parties", (t: Blueprint) => {
          t.hasPublicId("pty");
          t.string("name", 200).notNull().collate("arabic").comment("The party's name.");
        });
      }
    }
    const [step] = compileMigration(CreatePartiesMigration, { schema: "parties" }).steps;
    expect(step?.sql[0]).toBe(
      `create collation if not exists "parties"."arabic" (provider = icu, locale = 'ar-u-kn-true')`,
    );
    expect(step?.sql[1]).toContain('"name" varchar(200) collate "parties"."arabic" not null');
    expect(step?.inverse).toContain('drop collation if exists "parties"."arabic"');
  });

  it("refuses a collation on a column that is not text, and a locale that is not BCP 47", () => {
    class NumberCollationMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("parties", (t: Blueprint) => {
          t.integer("rank").notNull().collate("arabic").comment("Rank.");
        });
      }
    }
    class BadLocaleMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createCollation("arabic", "ar'; drop table x; --");
      }
    }
    expect(() => compileMigration(NumberCollationMigration, { schema: "parties" })).toThrow(
      /takes no collation/,
    );
    expect(() => compileMigration(BadLocaleMigration, { schema: "parties" })).toThrow(/BCP 47/);
  });

  it("writes the scope-tree columns, their indexes and the ancestor policy on a new table", () => {
    class CreateDocumentsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createExtension(Extension.Ltree);
        schema.create("documents", (t: Blueprint) => {
          t.hasPublicId("doc");
          t.scopeId().notNull().comment("The scope node the document belongs to.");
          t.scopePath().notNull().comment("The node's path, denormalised.");
          t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
        });
      }
    }
    const [step] = compileMigration(CreateDocumentsMigration, { schema: "documents" }).steps;
    expect(step?.sql[1]).toContain('"scope_id" varchar(33) not null');
    expect(step?.sql[1]).toContain('"scope_path" ltree not null');
    expect(step?.sql).toContain(
      'create index "idx_documents_scope_id" on "documents"."documents" ("scope_id")',
    );
    expect(step?.sql).toContain(
      'create index "idx_documents_scope_path" on "documents"."documents" using gist ("scope_path")',
    );
    const check = `"scope_path" ? array(select (granted || '.*')::lquery from unnest(string_to_array(current_setting('app.scope_paths', true), '|')) as granted)`;
    expect(step?.sql).toContain(
      `create policy "pol_documents_scope_path" on "documents"."documents" using (${check}) with check (${check})`,
    );
  });

  it("writes the metadata column of a HasMetadata model, with the GIN index only when asked", () => {
    class CreateCustomersMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("customers", (t: Blueprint) => {
          t.hasPublicId("cus");
          t.metadata();
        });
        schema.create("leads", (t: Blueprint) => {
          t.hasPublicId("led");
          t.metadata({ index: true });
        });
      }
    }
    const sql = compileMigration(CreateCustomersMigration, { schema: "crm" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain(`"metadata" jsonb default '{}'::jsonb not null`);
    expect(sql).not.toContain('"idx_customers_metadata"');
    expect(sql).toContain(
      'create index "idx_leads_metadata" on "crm"."leads" using gin ("metadata")',
    );

    class MetadataLeadsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("contacts", (t: Blueprint) => {
          t.metadata({ index: true });
        });
      }
    }
    expect(
      compileMigration(MetadataLeadsMigration, { schema: "crm" })
        .steps.flatMap((step) => step.sql)
        .join("\n"),
    ).toContain('create index concurrently "idx_contacts_metadata"');
  });

  it("writes the tree columns and the GiST index of a HasTree model, online on an existing table", () => {
    class CreateCategoriesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createExtension(Extension.Ltree);
        schema.create("categories", (t: Blueprint) => {
          t.hasPublicId("cat");
          t.tree();
        });
      }
    }
    const [step] = compileMigration(CreateCategoriesMigration, { schema: "catalog" }).steps;
    expect(step?.sql[1]).toContain('"parent_id" varchar(33) null');
    expect(step?.sql[1]).toContain('"tree_path" ltree not null');
    expect(step?.sql).toContain(
      'create index "idx_categories_parent_id" on "catalog"."categories" ("parent_id")',
    );
    expect(step?.sql).toContain(
      'create index "idx_categories_tree_path" on "catalog"."categories" using gist ("tree_path")',
    );

    class TreeCategoriesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("categories", (t: Blueprint) => {
          t.tree();
        });
      }
    }
    const steps = compileMigration(TreeCategoriesMigration, { schema: "catalog" }).steps;
    expect(steps.flatMap((each) => each.sql).join("\n")).toContain('"tree_path" ltree null');
    expect(steps.flatMap((each) => each.sql).join("\n")).toContain(
      'create index concurrently "idx_categories_tree_path"',
    );
  });

  it("writes geography columns with their GiST indexes, online on an existing table", () => {
    class CreateZonesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createExtension(Extension.Postgis);
        schema.create("zones", (t: Blueprint) => {
          t.hasPublicId("zon");
          t.polygon("area").notNull().comment("The zone's outer ring.");
          t.point("depot").nullable().comment("Where its drivers start.");
        });
      }
    }
    class AddRoutesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("zones", (t: Blueprint) => {
          t.line("route").nullable().comment("The usual run.");
        });
      }
    }
    const created = compileMigration(CreateZonesMigration, { schema: "places" })
      .steps.flatMap((each) => each.sql)
      .join("\n");
    expect(created).toContain('create extension if not exists "postgis"');
    expect(created).toContain('"area" geography(Polygon,4326) not null');
    expect(created).toContain('"depot" geography(Point,4326) null');
    expect(created).toContain(
      'create index "idx_zones_area" on "places"."zones" using gist ("area")',
    );
    expect(created).toContain(
      'create index "idx_zones_depot" on "places"."zones" using gist ("depot")',
    );
    const added = compileMigration(AddRoutesMigration, { schema: "places" })
      .steps.flatMap((each) => each.sql)
      .join("\n");
    expect(added).toContain('"route" geography(LineString,4326) null');
    expect(added).toContain(
      'create index concurrently "idx_zones_route" on "places"."zones" using gist ("route")',
    );
  });

  it("writes the inherited policy: ancestor reads and writes, and a select-only policy for the paths above", () => {
    class CreateTemplatesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createExtension(Extension.Ltree);
        schema.create("templates", (t: Blueprint) => {
          t.hasPublicId("tpl");
          t.scopePath().notNull().comment("The node the template is seeded at.");
          t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "inherited" });
        });
      }
    }
    const [step] = compileMigration(CreateTemplatesMigration, { schema: "templates" }).steps;
    const granted = `unnest(string_to_array(current_setting('app.scope_paths', true), '|')) as granted`;
    const check = `"scope_path" ? array(select (granted || '.*')::lquery from ${granted})`;
    expect(step?.sql).toContain(
      `create policy "pol_templates_scope_path" on "templates"."templates" using (${check}) with check (${check})`,
    );
    expect(step?.sql).toContain(
      `create policy "pol_templates_scope_path_inherited" on "templates"."templates" for select using ("scope_path" @> array(select granted::ltree from ${granted}))`,
    );
  });

  it("adds the inherited policies to an existing table with both inverses", () => {
    class InheritTemplatesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("templates", (t: Blueprint) => {
          t.scopePath().nullable().comment("The node the template is seeded at.");
          t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "inherited" });
        });
      }
    }
    const [step] = compileMigration(InheritTemplatesMigration, { schema: "templates" }).steps;
    expect(step?.inverse).toContain(
      'drop policy if exists "pol_templates_scope_path_inherited" on "templates"."templates"',
    );
    expect(step?.inverse).toContain(
      'drop policy if exists "pol_templates_scope_path" on "templates"."templates"',
    );
  });

  it("adds the scope path to an existing table with its GiST index as an online step", () => {
    class ScopeDocumentsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("documents", (t: Blueprint) => {
          t.scopePath().nullable().comment("The node's path, denormalised.");
          t.rowLevelSecurity("scope_path", { setting: "app.scope_path", match: "ancestor" });
        });
      }
    }
    const steps = compileMigration(ScopeDocumentsMigration, { schema: "documents" }).steps;
    expect(steps[0]?.sql).toContain(
      'alter table "documents"."documents" add column "scope_path" ltree null',
    );
    expect(steps[0]?.inverse).toContain(
      'drop policy if exists "pol_documents_scope_path" on "documents"."documents"',
    );
    expect(steps[1]).toEqual({
      sql: [
        'create index concurrently "idx_documents_scope_path" on "documents"."documents" using gist ("scope_path")',
      ],
      transactional: false,
      inverse: ['drop index concurrently if exists "documents"."idx_documents_scope_path"'],
    });
  });

  it.each([
    [
      "an ancestor match on a column that is not ltree",
      (t: Blueprint) => {
        t.uuid("owner_id").notNull().comment("The owner.");
        t.rowLevelSecurity("owner_id", { setting: "app.owner_id", match: "ancestor" });
      },
      /is not ltree/,
    ],
    [
      "an inherited match on a column that is not ltree",
      (t: Blueprint) => {
        t.uuid("owner_id").notNull().comment("The owner.");
        t.rowLevelSecurity("owner_id", { setting: "app.owner_id", match: "inherited" });
      },
      /takes no inherited match/,
    ],
    [
      "a policy on a column the blueprint lacks",
      (t: Blueprint) =>
        t.rowLevelSecurity("scope_path", { setting: "app.scope_path", match: "ancestor" }),
      /needs the scope_path column/,
    ],
    [
      "a setting without its prefix",
      (t: Blueprint) => t.rowLevelSecurity("scope_id", { setting: "scope_id", match: "equals" }),
      /not a custom setting/,
    ],
    [
      "a second policy",
      (t: Blueprint) => {
        t.scopeId().notNull().comment("The scope node.");
        t.scopePath().notNull().comment("The node's path.");
        t.rowLevelSecurity("scope_id", { setting: "app.scope_id", match: "equals" });
        t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
      },
      /a table takes one/,
    ],
  ])("refuses %s", (_name, define, message) => {
    class BadMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("documents", define);
      }
    }
    expect(() => compileMigration(BadMigration, { schema: "documents" })).toThrow(message);
  });

  it.each([
    [
      "a column without a comment",
      (t: Blueprint) => t.string("sku", 64).notNull(),
      /every column states notNull\(\) or nullable\(\) and has a comment\(\); not sku/,
    ],
    [
      "a column without its nullability",
      (t: Blueprint) => t.string("sku", 64).comment("The SKU."),
      /not sku/,
    ],
    [
      "a concurrent index on a table being created",
      (t: Blueprint) => {
        t.hasPublicId("prd");
        t.index(["id"]).concurrently();
      },
      /builds in the transaction/,
    ],
  ])("refuses %s on a new table", (_name, define, message) => {
    class BadMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("products", define);
      }
    }
    expect(() => compileMigration(BadMigration, { schema: "catalogue" })).toThrow(message);
  });

  it.each([
    [
      "NOT NULL without a default",
      (t: Blueprint) => t.string("sku", 64).notNull().comment("The SKU."),
      /contract step/,
    ],
    ["an index that is not concurrent", (t: Blueprint) => t.index(["sku"]), /add concurrently\(\)/],
    ["a primary key", (t: Blueprint) => t.primary(["sku"]), /never added to an existing table/],
  ])("refuses %s on an existing table", (_name, define, message) => {
    class BadMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("products", define);
      }
    }
    expect(() => compileMigration(BadMigration, { schema: "catalogue" })).toThrow(message);
  });

  it("refuses an unapproved extension and a raw statement without an inverse", () => {
    // pg_cron is rejected (data-layer decision 7), so it stays an unapproved extension.
    class CronMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.createExtension("pg_cron" as Extension);
      }
    }
    class RawMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.sql("select 1", {} as { inverse: string });
      }
    }
    expect(() => compileMigration(CronMigration, { schema: "geo" })).toThrow(/needs an ADR/);
    expect(() => compileMigration(RawMigration, { schema: "geo" })).toThrow(/needs \{ inverse \}/);
  });

  it("refuses a Postgres sequence, so a document number is always a Sequence", () => {
    class CounterMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.sql("CREATE  SEQUENCE billing.invoice_no START 1", {
          inverse: "drop sequence billing.invoice_no",
        });
      }
    }
    expect(() => compileMigration(CounterMigration, { schema: "billing" })).toThrow(
      /creates a Postgres sequence/,
    );
  });

  it("refuses a class that is not a migration, a bad schema name and a misnamed macro", () => {
    class NotAMigration {}
    class Classify extends Macro {
      apply(t: Blueprint): ColumnGroup {
        return t.group();
      }
    }
    class StringMacro extends Macro {
      apply(t: Blueprint): ColumnGroup {
        return t.group();
      }
    }
    class EmptyMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("things", () => undefined);
      }
    }
    expect(() =>
      compileMigration(NotAMigration as unknown as typeof EmptyMigration, { schema: "x" }),
    ).toThrow(/does not extend Migration/);
    expect(() => compileMigration(EmptyMigration, { schema: "Bad-Schema" })).toThrow(TypeError);
    expect(() => compileMigration(EmptyMigration, { schema: "x", macros: [Classify] })).toThrow(
      /not named <Name>Macro/,
    );
    expect(() => compileMigration(EmptyMigration, { schema: "x", macros: [StringMacro] })).toThrow(
      /takes the name t.string/,
    );
  });

  describe("the contract step of an existing table (ADR 0347 d1 to d3)", () => {
    /** The scope path's ancestor policy, as the table was created with it. */
    const SCOPE_PATHS = { setting: "app.scope_paths", match: "ancestor" } as const;
    const paths = `"scope_path" ? array(select (granted || '.*')::lquery from unnest(string_to_array(current_setting('app.scope_paths', true), '|')) as granted)`;

    class ContractDocumentsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.refuseNulls("owner_id", ["documents", "folders"], "Backfill owner_id first.");
        schema.table("documents", (t: Blueprint) => {
          t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
          t.change("owner_id").notNull();
          t.rowLevelSecurity("owner_id", { setting: "app.owner_id", match: "equals" });
          t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
        });
      }
    }
    const [step] = compileMigration(ContractDocumentsMigration, { schema: "documents" }).steps;

    it("refuses first, in one DO block that counts each table's nulls and undoes nothing", () => {
      expect(step?.transactional).toBe(true);
      const preflight = step?.sql[0] ?? "";
      expect(preflight).toMatch(/^do \$\$\n/);
      expect(preflight).toContain(
        `select count(*) into n from "documents"."documents" where "owner_id" is null;`,
      );
      expect(preflight).toContain(`from "documents"."folders" where "owner_id" is null;`);
      expect(preflight).toContain("'documents.folders'");
      expect(preflight).toContain(
        "raise exception 'refused before any change: rows with a null %: %. %', 'owner_id', array_to_string(found, ', '), 'Backfill owner_id first.';",
      );
      expect(preflight).not.toMatch(/\n\s*\n/);
    });

    it("sets NOT NULL, swaps the scope-path policy for the equality and makes the scope path restrictive", () => {
      expect(step?.sql.slice(1)).toEqual([
        `${REFUSED_NOT_NULL}alter table "documents"."documents" alter column "owner_id" set not null`,
        'drop policy "pol_documents_scope_path" on "documents"."documents"',
        'alter table "documents"."documents" enable row level security',
        'alter table "documents"."documents" force row level security',
        `create policy "pol_documents_owner_id" on "documents"."documents" using ("owner_id" = nullif(current_setting('app.owner_id', true), '')::varchar(33)) with check ("owner_id" = nullif(current_setting('app.owner_id', true), '')::varchar(33))`,
        `create policy "pol_documents_scope_path" on "documents"."documents" as restrictive using (nullif(current_setting('app.scope_paths', true), '') is null or ${paths}) with check (nullif(current_setting('app.scope_paths', true), '') is null or ${paths})`,
      ]);
    });

    it("derives the inverse: the old permissive policy back, row-level security left on", () => {
      expect(step?.inverse).toEqual([
        'drop policy if exists "pol_documents_scope_path" on "documents"."documents"',
        'drop policy if exists "pol_documents_owner_id" on "documents"."documents"',
        `create policy "pol_documents_scope_path" on "documents"."documents" using (${paths}) with check (${paths})`,
        'alter table "documents"."documents" alter column "owner_id" drop not null',
      ]);
    });

    it("writes the squawk ignore only above a SET NOT NULL that a whole-table pre-flight above vouched for", () => {
      class UnvouchedMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("documents", (t: Blueprint) => t.change("owner_id").notNull());
          schema.refuseNulls("owner_id", ["documents", "folders"], "Backfill first.");
          schema.refuseNulls("parent_id", ["folders"], "Backfill first.", { where: "true" });
          schema.table("folders", (t: Blueprint) => {
            t.change("owner_id").notNull();
            t.change("parent_id").notNull();
            t.change("title").notNull();
          });
        }
      }
      const sql = compileMigration(UnvouchedMigration, { schema: "documents" }).steps[0]?.sql;
      expect(sql?.filter((statement) => statement.includes("set not null"))).toEqual([
        'alter table "documents"."documents" alter column "owner_id" set not null',
        `${REFUSED_NOT_NULL}alter table "documents"."folders" alter column "owner_id" set not null`,
        'alter table "documents"."folders" alter column "parent_id" set not null',
        'alter table "documents"."folders" alter column "title" set not null',
      ]);
    });

    it("sets a safe NOT NULL through a NOT VALID check, validated in a later step (ADR 0159)", () => {
      class SafeContractMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.refuseNulls("owner_id", ["documents"], "Backfill first.");
          schema.table("documents", (t: Blueprint) => t.change("owner_id").notNull({ safe: true }));
        }
      }
      const table = '"documents"."documents"';
      const check = '"ck_documents_owner_id_not_null"';
      const [first, later, ...rest] = compileMigration(SafeContractMigration, {
        schema: "documents",
      }).steps;
      expect(rest).toEqual([]);
      expect(first?.sql.slice(1)).toEqual([
        `alter table ${table} add constraint ${check} check ("owner_id" is not null) not valid`,
      ]);
      expect(first?.inverse).toEqual([`alter table ${table} drop constraint if exists ${check}`]);
      expect(later).toEqual({
        sql: [
          `alter table ${table} validate constraint ${check}`,
          `alter table ${table} alter column "owner_id" set not null`,
          `alter table ${table} drop constraint ${check}`,
        ],
        transactional: true,
        inverse: [
          `alter table ${table} alter column "owner_id" drop not null`,
          `alter table ${table} add constraint ${check} check ("owner_id" is not null) not valid`,
        ],
      });
    });

    it("drops a renamed table's policy by the name it was created under", () => {
      class ContractProgressMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("checklist_progresses", (t: Blueprint) => {
            t.dropRowLevelSecurity("scope_path", { ...SCOPE_PATHS, table: "checklist_progress" });
          });
        }
      }
      expect(
        compileMigration(ContractProgressMigration, { schema: "workflow" }).steps[0]?.sql,
      ).toEqual([
        'drop policy "pol_checklist_progress_scope_path" on "workflow"."checklist_progresses"',
      ]);
    });

    it.each([
      [
        "a second permissive policy",
        (t: Blueprint) => {
          t.rowLevelSecurity("owner_id", { setting: "app.owner_id", match: "equals" });
          t.rowLevelSecurity("scope_path", SCOPE_PATHS);
        },
        /a table takes one permissive policy/,
      ],
      [
        "a second policy on one column",
        (t: Blueprint) => {
          t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
          t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
        },
        /already has a policy on scope_path/,
      ],
      [
        "a restrictive inherited match",
        (t: Blueprint) =>
          t.rowLevelSecurity("scope_path", {
            setting: "app.scope_paths",
            match: "inherited",
            restrictive: true,
          }),
        /never restrictive/,
      ],
      [
        "dropping an inherited policy",
        (t: Blueprint) =>
          t.dropRowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "inherited" }),
        /not supported/,
      ],
    ])("refuses %s", (_name, define, message) => {
      class BadMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("documents", define);
        }
      }
      expect(() => compileMigration(BadMigration, { schema: "documents" })).toThrow(message);
    });

    it("writes the platform match, the scope path exempting its NULL rows, and a narrowed pre-flight", () => {
      class ContractNoticesMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.refuseNulls("owner_id", ["notices"], "Backfill first.", {
            where: 'nlevel("scope_path") > 1',
          });
          schema.table("notices", (t: Blueprint) => {
            t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
            t.rowLevelSecurity("owner_id", { setting: "app.owner_id", match: "platform" });
            t.rowLevelSecurity("scope_path", {
              ...SCOPE_PATHS,
              restrictive: true,
              exemptNull: "owner_id",
            });
          });
        }
      }
      const sql =
        compileMigration(ContractNoticesMigration, { schema: "docs" }).steps[0]?.sql ?? [];
      const value = "nullif(current_setting('app.owner_id', true), '')::varchar(33)";
      const own = `"owner_id" is not distinct from ${value}`;
      expect(sql[0]).toContain(
        `from "docs"."notices" where "owner_id" is null and (nlevel("scope_path") > 1);`,
      );
      expect(sql).toContain(
        `create policy "pol_notices_owner_id" on "docs"."notices" using ("owner_id" = ${value} or "owner_id" is null) with check (${own})`,
      );
      expect(sql).toContain(
        `create policy "pol_notices_owner_id_write_update" on "docs"."notices" as restrictive for update using (${own})`,
      );
      expect(sql).toContain(
        `create policy "pol_notices_owner_id_write_delete" on "docs"."notices" as restrictive for delete using (${own})`,
      );
      const granted = `array(select granted::ltree from unnest(string_to_array(current_setting('app.scope_paths', true), '|')) as granted)`;
      const narrowed = `nullif(current_setting('app.scope_paths', true), '') is null or ("owner_id" is null and "scope_path" @> ${granted}) or ${paths}`;
      expect(sql).toContain(
        `create policy "pol_notices_scope_path" on "docs"."notices" as restrictive using (${narrowed}) with check (${narrowed})`,
      );
    });

    it("refuses a restrictive platform match, exemptNull on a permissive policy, and a multi-line where", () => {
      class RestrictivePlatformMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("notices", (t: Blueprint) =>
            t.rowLevelSecurity("owner_id", {
              setting: "app.owner_id",
              match: "platform",
              restrictive: true,
            }),
          );
        }
      }
      class PermissiveExemptMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("notices", (t: Blueprint) =>
            t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, exemptNull: "owner_id" }),
          );
        }
      }
      class MultiLineWhereMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.refuseNulls("owner_id", ["notices"], "Backfill first.", {
            where: "true\nor true",
          });
        }
      }
      expect(() => compileMigration(RestrictivePlatformMigration, { schema: "docs" })).toThrow(
        /never restrictive/,
      );
      expect(() => compileMigration(PermissiveExemptMigration, { schema: "docs" })).toThrow(
        /restrictive policy only/,
      );
      expect(() => compileMigration(MultiLineWhereMigration, { schema: "docs" })).toThrow(
        /one-line where/,
      );
    });

    it("refuses a drop on a table being created, and a pre-flight with no table or remedy", () => {
      class DropOnCreateMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.create("documents", (t: Blueprint) =>
            t.dropRowLevelSecurity("scope_path", SCOPE_PATHS),
          );
        }
      }
      class NoTablesMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.refuseNulls("owner_id", [], "Backfill first.");
        }
      }
      class NoRemedyMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.refuseNulls("owner_id", ["documents"], " ");
        }
      }
      expect(() => compileMigration(DropOnCreateMigration, { schema: "documents" })).toThrow(
        /has no policy to drop/,
      );
      expect(() => compileMigration(NoTablesMigration, { schema: "documents" })).toThrow(
        /at least one table/,
      );
      expect(() => compileMigration(NoRemedyMigration, { schema: "documents" })).toThrow(/remedy/);
    });
  });
  describe("the platformTable and reviewedPolicy declarations (ADR 0239 amendment, group (c))", () => {
    it("compiles each declaration to its marker line, which tableDeclarations reads back", () => {
      class DeclareMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("inbox", (t: Blueprint) =>
            t.platformTable("  received event ids only; no customer data  "),
          );
          schema.create("routes", (t: Blueprint) => {
            t.string("route_id", 33).notNull().comment("The route.");
            t.reviewedPolicy("a pre-tenant route read through a setting", [
              "pol_routes_read",
              "pol_routes_write",
            ]);
          });
        }
      }
      const sql = sqlOf(DeclareMigration);
      expect(sql).toContain(
        "-- stackra:platform-table outbox.inbox received event ids only; no customer data;\n",
      );
      expect(sql).toContain(
        "-- stackra:reviewed-policy outbox.routes pol_routes_read,pol_routes_write a pre-tenant route read through a setting;\n",
      );
      const declared = tableDeclarations(sql);
      expect([...declared.platform]).toEqual([
        ["outbox.inbox", "received event ids only; no customer data"],
      ]);
      expect([...declared.reviewed]).toEqual([
        [
          "outbox.routes",
          {
            policies: ["pol_routes_read", "pol_routes_write"],
            reason: "a pre-tenant route read through a setting",
          },
        ],
      ]);
      // A marker is a comment: it has no inverse, and the declared create still compiles first after it.
      const [step] = compileMigration(DeclareMigration, { schema: "outbox" }).steps;
      expect(step?.inverse).toEqual(['drop table if exists "outbox"."routes"']);
    });

    it("refuses an empty or multi-line reason and a review that names no policy", () => {
      for (const reason of ["", "   ", "two\nlines"]) {
        class PlatformMigration extends Migration {
          up(schema: SchemaBuilder): void {
            schema.table("inbox", (t: Blueprint) => t.platformTable(reason));
          }
        }
        class ReviewMigration extends Migration {
          up(schema: SchemaBuilder): void {
            schema.table("routes", (t: Blueprint) => t.reviewedPolicy(reason, ["pol_routes_read"]));
          }
        }
        expect(() => sqlOf(PlatformMigration)).toThrow(/reason/);
        expect(() => sqlOf(ReviewMigration)).toThrow(/reason/);
      }
      class NoPolicyMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("routes", (t: Blueprint) => t.reviewedPolicy("reviewed", []));
        }
      }
      class BadPolicyMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("routes", (t: Blueprint) => t.reviewedPolicy("reviewed", ["pol x"]));
        }
      }
      class TwiceMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("routes", (t: Blueprint) => {
            t.platformTable("no tenant data");
            t.reviewedPolicy("reviewed", ["pol_routes_read"]);
          });
        }
      }
      expect(() => sqlOf(NoPolicyMigration)).toThrow(/names the policies/);
      expect(() => sqlOf(BadPolicyMigration)).toThrow();
      expect(() => sqlOf(TwiceMigration)).toThrow(/already declares/);
    });

    it("refuses a platform table that holds an owner column or a policy", () => {
      class ScopeIdMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.create("cursors", (t: Blueprint) => {
            t.platformTable("one row per consumer");
            t.string("scope_id", 63).nullable().comment("The scope.");
          });
        }
      }
      class IsolationScopeMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("cursors", (t: Blueprint) => {
            t.platformTable("one row per consumer");
            t.string("isolation_scope_id", 33).nullable().comment("The isolation scope.");
          });
        }
      }
      class SettingDefaultMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("cursors", (t: Blueprint) => {
            t.platformTable("one row per consumer");
            t.string("owner_id", 33)
              .nullable()
              .defaultSetting("app.owner_id")
              .comment("Filled from the call.");
          });
        }
      }
      class PolicyMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.create("cursors", (t: Blueprint) => {
            t.platformTable("one row per consumer");
            t.uuid("workspace_id").notNull().comment("The workspace.");
            t.rowLevelSecurity("workspace_id", { setting: "app.workspace_id", match: "equals" });
          });
        }
      }
      expect(() => sqlOf(ScopeIdMigration)).toThrow(/platform table.*scope_id/);
      expect(() => sqlOf(IsolationScopeMigration)).toThrow(/isolation_scope_id/);
      expect(() => sqlOf(SettingDefaultMigration)).toThrow(/owner_id/);
      expect(() => sqlOf(PolicyMigration)).toThrow(/workspace_id policy/);
    });
  });
  describe("t.systemAccess and schema.systemFunction (ADR 0239 amendment, gap A)", () => {
    class ClaimMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("jobs", (t: Blueprint) => {
          t.string("id", 33).notNull().comment("The job.");
          t.string("tenant_id", 33).notNull().comment("The owning tenant.");
          t.timestamp("leased_until").nullable().comment("When the claim's lease ends.");
          t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equals" });
          t.systemAccess({
            select: ["id", "tenant_id", "leased_until"],
            update: ["leased_until"],
            reason: " the worker claims due jobs across tenants ",
          });
        });
        schema.table("inbox", (t: Blueprint) =>
          t.systemAccess({ select: ["id", "tenant_id"], reason: "a webhook finds the tenant" }),
        );
        schema.systemFunction({
          name: "claim_jobs",
          args: { max_jobs: "integer" },
          returns: { id: "varchar(33)", tenant_id: "varchar(33)" },
          sql: "select j.id, j.tenant_id from outbox.jobs j limit max_jobs",
          reason: "the worker claims due jobs across tenants",
        });
      }
    }

    it("compiles the grants, role-scoped policies and the definer function, which tableDeclarations reads back", () => {
      const sql = sqlOf(ClaimMigration);
      const role = '"stackra_system_access"';
      for (const line of [
        "-- stackra:system-access outbox.jobs select=id,tenant_id,leased_until update=leased_until the worker claims due jobs across tenants;\n",
        `  create role ${role} nologin nobypassrls;\n`,
        `grant usage on schema "outbox" to ${role};\n`,
        `grant select ("id", "tenant_id", "leased_until") on "outbox"."jobs" to ${role};\n`,
        `create policy "pol_jobs_system_access_select" on "outbox"."jobs" for select to ${role} using (true);\n`,
        `grant update ("leased_until") on "outbox"."jobs" to ${role};\n`,
        `create policy "pol_jobs_system_access_update" on "outbox"."jobs" for update to ${role} using (true) with check (true);\n`,
        "-- stackra:system-access outbox.inbox select=id,tenant_id a webhook finds the tenant;\n",
        "-- stackra:system-function outbox.claim_jobs the worker claims due jobs across tenants;\n",
        'create function "outbox"."claim_jobs"("max_jobs" integer) returns table ("id" varchar(33), "tenant_id" varchar(33))\nlanguage sql security definer set search_path = pg_catalog, pg_temp\nas $stackra$\nselect j.id, j.tenant_id from outbox.jobs j limit max_jobs\n$stackra$;\n',
      ])
        expect(sql).toContain(line);
      expect(sql).not.toContain('"pol_inbox_system_access_update"');
      // EXECUTE is revoked from PUBLIC before the hand-over and granted to the migrator after it.
      const order = [
        'revoke all on function "outbox"."claim_jobs"(integer) from public',
        `grant ${role} to current_user`,
        `grant create on schema "outbox" to ${role}`,
        `alter function "outbox"."claim_jobs"(integer) owner to ${role}`,
        `revoke create on schema "outbox" from ${role}`,
        'grant execute on function "outbox"."claim_jobs"(integer) to current_user',
        `revoke ${role} from current_user`,
      ].map((statement) => sql.indexOf(`${statement};\n`));
      expect(order.every((at) => at >= 0)).toBe(true);
      expect(order).toEqual([...order].sort((a, b) => a - b));
      const declared = tableDeclarations(sql);
      expect([...declared.systemAccess]).toEqual([
        [
          "outbox.jobs",
          {
            select: ["id", "tenant_id", "leased_until"],
            update: ["leased_until"],
            reason: "the worker claims due jobs across tenants",
          },
        ],
        [
          "outbox.inbox",
          { select: ["id", "tenant_id"], update: [], reason: "a webhook finds the tenant" },
        ],
      ]);
      expect([...declared.systemFunctions]).toEqual([
        ["outbox.claim_jobs", "the worker claims due jobs across tenants"],
      ]);
      // A down drops the function and revokes the grants; the role and the schema usage stay.
      const [step] = compileMigration(ClaimMigration, { schema: "outbox" }).steps;
      expect(step?.inverse).toContain('drop function if exists "outbox"."claim_jobs"(integer)');
      expect(step?.inverse).toContain(
        `revoke update ("leased_until") on "outbox"."jobs" from ${role}`,
      );
    });

    it("lets the role through a platform-form table's _write_update only with update columns", () => {
      class PlatformClaimMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("messages", (t: Blueprint) => {
            t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });
            t.systemAccess({
              select: ["id", "tenant_id"],
              update: ["leased_until"],
              reason: "the relay claims",
            });
          });
        }
      }
      class PlatformLookupMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.table("messages", (t: Blueprint) => {
            t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });
            t.systemAccess({ select: ["id", "tenant_id"], reason: "a webhook finds the tenant" });
          });
        }
      }
      const own =
        "\"tenant_id\" is not distinct from nullif(current_setting('app.tenant_id', true), '')::varchar(33)";
      const policy = 'create policy "pol_messages_tenant_id_write_';
      const on = 'on "outbox"."messages" as restrictive for';
      const claims = sqlOf(PlatformClaimMigration);
      expect(claims).toContain(
        `${policy}update" ${on} update using ((${own}) or current_user = 'stackra_system_access');\n`,
      );
      expect(claims).toContain(`${policy}delete" ${on} delete using (${own});\n`);
      const lookup = sqlOf(PlatformLookupMigration);
      expect(lookup).toContain(`${policy}update" ${on} update using (${own});\n`);
      expect(lookup).not.toContain("current_user = 'stackra_system_access'");
    });

    it("refuses a system access without its reason or columns, on a platform table, or twice", () => {
      expect(refusal((t) => t.systemAccess({ select: ["id"], reason: "" }))).toThrow(/reason/);
      expect(refusal((t) => t.systemAccess({ select: ["id"], reason: "a\nb" }))).toThrow(
        /one line/,
      );
      expect(refusal((t) => t.systemAccess({ select: [], reason: "r" }))).toThrow(
        /names the columns/,
      );
      expect(refusal((t) => t.systemAccess({ select: ["Id"], reason: "r" }))).toThrow(
        /database name/,
      );
      expect(
        refusal((t) => t.systemAccess({ select: ["id"], update: ["x y"], reason: "r" })),
      ).toThrow(/database name/);
      expect(
        refusal((t) => {
          t.systemAccess({ select: ["id"], reason: "r" });
          t.systemAccess({ select: ["id"], reason: "r" });
        }),
      ).toThrow(/already declares its system access/);
      expect(
        refusal((t) => {
          t.platformTable("no tenant data");
          t.systemAccess({ select: ["id"], reason: "r" });
        }),
      ).toThrow(/platform table/);
    });

    it("refuses a system function without its reason or columns, with a bad type or body", () => {
      const base = {
        name: "find_tenant",
        args: { id: "varchar(33)" },
        returns: { tenant_id: "varchar(33)" },
        sql: "select 1",
        reason: "a webhook finds the tenant",
      };
      for (const [change, message] of [
        [{ reason: " " }, /reason/],
        [{ name: "Find" }, /database name/],
        [{ returns: {} }, /declares the columns it returns/],
        [{ args: { id: "text; drop table x" } }, /not a SQL type name/],
        [{ returns: { "tenant id": "text" } }, /database name/],
        [{ sql: "  " }, /needs a body/],
        [{ sql: "select 1\n\nselect 2" }, /no blank line/],
        [{ sql: "select $stackra$x$stackra$" }, /no blank line and no/],
      ] as const) {
        class FunctionMigration extends Migration {
          up(schema: SchemaBuilder): void {
            schema.systemFunction({ ...base, ...change });
          }
        }
        expect(() => sqlOf(FunctionMigration)).toThrow(message);
      }
    });
  });

  describe("expand and contract steps, checks and exclusions (STA-1406)", () => {
    const table = '"outbox"."jobs"';
    const AFTER = "outbox.0007_stop_writing_note";

    it("drops a column after its release gate, with a reviewed squawk ignore and a dev inverse that adds it back", () => {
      const { after, steps } = compiledOn((t) => {
        t.dropColumn("note", { after: AFTER, type: "varchar(200)" });
      });
      expect(after).toEqual([AFTER]);
      expect(steps).toHaveLength(1);
      const [gate, drop] = steps[0]?.sql ?? [];
      expect(gate).toMatch(/^do \$\$/);
      expect(gate).toContain("to_regclass('schema_migrations_history') is null");
      expect(gate).toContain("current_setting('stackra.migrate_from_version', true)");
      expect(gate).toContain("name ~ '^[0-9]+_outbox_0007_stop_writing_note(_[0-9]+)?$'");
      expect(gate).toContain("'outbox.jobs drop column note', 'outbox.0007_stop_writing_note'");
      expect(drop).toBe(
        "-- lint: a contract step: the release gate above refuses it until the release that stopped using it has shipped (ADR 0159 d3).\n" +
          "-- squawk-ignore ban-drop-column\n" +
          `alter table ${table} drop column "note"`,
      );
      expect(steps[0]?.inverse).toEqual([`alter table ${table} add column "note" varchar(200)`]);
    });

    it("adds a contract step's release to the declared after edges once", () => {
      class DropMigration extends Migration({
        after: ["search.0001_create_text_functions" as MigrationId, AFTER as MigrationId],
      }) {
        up(schema: SchemaBuilder): void {
          schema.table("jobs", (t) => {
            t.dropColumn("note", { after: AFTER, type: "text" });
            t.dropColumn("memo", { after: "outbox.0008_stop_writing_memo", type: "text" });
          });
          schema.drop("old_jobs", { after: "outbox.0008_stop_writing_memo" });
        }
      }
      expect(compileMigration(DropMigration, { schema: "outbox" }).after).toEqual([
        "search.0001_create_text_functions",
        AFTER,
        "outbox.0008_stop_writing_memo",
      ]);
    });

    it("refuses a drop on a new table, without a migration id, with an unknown type, twice, or beside another step on the column", () => {
      class CreateMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.create("jobs", (t) => {
            t.dropColumn("note", { after: AFTER, type: "text" });
          });
        }
      }
      expect(() => sqlOf(CreateMigration)).toThrow(/created by this migration/);
      expect(refusal((t) => t.dropColumn("note", { after: "v2", type: "text" }))).toThrow(
        /needs \{ after \}/,
      );
      expect(
        refusal((t) => t.dropColumn("note", { after: AFTER, type: "varchar(200); drop x" })),
      ).toThrow(/not a column type/);
      expect(
        refusal((t) => {
          t.dropColumn("note", { after: AFTER, type: "text" });
          t.dropColumn("note", { after: AFTER, type: "text" });
        }),
      ).toThrow(/already dropped/);
      expect(
        refusal((t) => {
          t.dropColumn("note", { after: AFTER, type: "text" });
          t.change("note").nullable();
        }),
      ).toThrow(/is dropped by this blueprint/);
      expect(
        refusal((t) => {
          t.string("note").nullable().comment("A note.");
          t.dropColumn("note", { after: AFTER, type: "text" });
        }),
      ).toThrow(/is dropped by this blueprint/);
    });

    it("starts a column rename with the new column and a sync trigger, undone trigger first", () => {
      const { after, steps } = compiledOn((t) => {
        t.renameColumn("note", "memo", { type: "varchar(200)" })
          .nullable()
          .comment("The job's note, under its new name.");
      });
      expect(after).toEqual([]);
      const sql = steps[0]?.sql ?? [];
      expect(sql[0]).toBe(`alter table ${table} add column "memo" varchar(200) null`);
      expect(sql[1]).toBe(
        `comment on column ${table}."memo" is 'The job''s note, under its new name.'`,
      );
      expect(sql[2]).toBe(
        [
          'create function "outbox"."trg_jobs_note_memo"() returns trigger language plpgsql set search_path = pg_catalog, pg_temp as $stackra$',
          "begin",
          "  if tg_op = 'INSERT' then",
          '    if new."memo" is null then new."memo" := new."note";',
          '    elsif new."note" is null then new."note" := new."memo";',
          "    end if;",
          '  elsif new."memo" is distinct from old."memo" then new."note" := new."memo";',
          '  elsif new."note" is distinct from old."note" then new."memo" := new."note";',
          "  end if;",
          "  return new;",
          "end",
          "$stackra$",
        ].join("\n"),
      );
      expect(sql[3]).toBe(
        `create trigger "trg_jobs_note_memo" before insert or update on ${table} for each row execute function "outbox"."trg_jobs_note_memo"()`,
      );
      expect(steps[0]?.inverse).toEqual([
        `drop trigger if exists "trg_jobs_note_memo" on ${table}`,
        'drop function if exists "outbox"."trg_jobs_note_memo"()',
        `alter table ${table} drop column if exists "memo"`,
      ]);
    });

    it("finishes a rename behind its release and backfill gates, and its dev inverse restores the old column and trigger", () => {
      const { after, steps } = compiledOn((t) => {
        t.finishRenameColumn("note", "memo", { after: AFTER, type: "varchar(200)" });
      });
      expect(after).toEqual([AFTER]);
      const sql = steps[0]?.sql ?? [];
      expect(sql[0]).toContain("'outbox.jobs finish rename note to memo'");
      expect(sql[1]).toContain(
        `select count(*) into n from (select 1 from ${table} where "memo" is null and "note" is not null limit 1001) pending;`,
      );
      expect(sql[1]).toContain(
        "run the backfill that copies note into memo before note is dropped",
      );
      expect(sql.slice(2)).toEqual([
        `drop trigger if exists "trg_jobs_note_memo" on ${table}`,
        "-- lint: the rename's sync trigger function: only its trigger, dropped above, calls it.\n" +
          "-- squawk-ignore ban-drop-function\n" +
          'drop function if exists "outbox"."trg_jobs_note_memo"()',
        expect.stringContaining(
          `-- squawk-ignore ban-drop-column\nalter table ${table} drop column "note"`,
        ),
      ]);
      const inverse = steps[0]?.inverse;
      expect(inverse).not.toBe(false);
      expect((inverse as readonly string[])[0]).toBe(
        `alter table ${table} add column "note" varchar(200)`,
      );
      expect((inverse as readonly string[])[1]).toMatch(
        /^create function "outbox"\."trg_jobs_note_memo"\(\)/,
      );
      expect((inverse as readonly string[])[2]).toMatch(/^create trigger "trg_jobs_note_memo"/);
    });

    it("refuses a rename to itself, of a column the blueprint adds, or a finished rename beside a drop of it", () => {
      expect(refusal((t) => t.renameColumn("note", "note", { type: "text" }))).toThrow(/itself/);
      expect(
        refusal((t) => {
          t.string("note").nullable().comment("A note.");
          t.renameColumn("note", "memo", { type: "text" }).nullable().comment("A memo.");
        }),
      ).toThrow(/defined, not renamed/);
      expect(
        refusal((t) => {
          t.dropColumn("note", { after: AFTER, type: "text" });
          t.finishRenameColumn("note", "memo", { after: AFTER, type: "text" });
        }),
      ).toThrow(/its rename is finished by this blueprint/);
      expect(
        refusal((t) => t.renameColumn("note", "memo", { type: "money" }).nullable().comment("x")),
      ).toThrow(/not a column type/);
      expect(
        refusal((t) => t.renameColumn("note", "memo", { type: "text" }).notNull().comment("x")),
      ).toThrow(/nullable or has a default/);
    });

    it("writes a check inline on a new table, and NOT VALID then validated on an existing one", () => {
      class CreateMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.create("jobs", (t) => {
            t.integer("attempts").notNull().comment("Attempts so far.");
            t.check("attempts_not_negative", "attempts >= 0");
          });
        }
      }
      expect(sqlOf(CreateMigration)).toContain(
        `create table ${table} (\n  "attempts" integer not null,\n  constraint "ck_jobs_attempts_not_negative" check (attempts >= 0)\n)`,
      );
      const { steps } = compiledOn((t) => {
        t.check("attempts_not_negative", "attempts >= 0");
      });
      expect(steps[0]).toEqual({
        sql: [
          `alter table ${table} add constraint "ck_jobs_attempts_not_negative" check (attempts >= 0) not valid`,
        ],
        transactional: true,
        inverse: [`alter table ${table} drop constraint if exists "ck_jobs_attempts_not_negative"`],
      });
      expect(steps[1]).toEqual({
        sql: [`alter table ${table} validate constraint "ck_jobs_attempts_not_negative"`],
        transactional: true,
        inverse: [],
      });
    });

    it("drops a check under the name it was created with, and its inverse adds it back NOT VALID", () => {
      const { steps } = compiledOn((t) => {
        t.dropCheck("attempts_not_negative", { expression: "attempts >= 0", table: "old_jobs" });
      });
      expect(steps).toEqual([
        {
          sql: [
            "-- lint: a dropped check only relaxes the table: no release relies on a write being refused.\n" +
              "-- squawk-ignore ban-drop-constraint\n" +
              `alter table ${table} drop constraint "ck_old_jobs_attempts_not_negative"`,
          ],
          transactional: true,
          inverse: [
            `alter table ${table} add constraint "ck_old_jobs_attempts_not_negative" check (attempts >= 0) not valid`,
          ],
        },
      ]);
    });

    it("refuses a check whose expression could end its statement, and a second check of one name", () => {
      expect(refusal((t) => t.check("x", "a > 0; drop table jobs"))).toThrow(/without ; or \$\$/);
      expect(refusal((t) => t.check("x", "a > 0\n or b"))).toThrow(/one line/);
      expect(refusal((t) => t.check("x", "  "))).toThrow(/one line/);
      expect(
        refusal((t) => {
          t.check("x", "a > 0");
          t.check("x", "b > 0");
        }),
      ).toThrow(/already has the check x/);
    });

    it("writes an exclusion constraint on a new table and refuses one on an existing table", () => {
      class CreateMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.createExtension(Extension.BtreeGist);
          schema.create("bookings", (t) => {
            t.uuid("room_id").notNull().comment("The booked room.");
            t.timestamp("cancelled_at").nullable().comment("When it was cancelled.");
            t.exclude(
              "no_double_booking",
              { room_id: "=", during: "&&" },
              { where: "cancelled_at is null" },
            );
          });
        }
      }
      expect(sqlOf(CreateMigration)).toContain(
        `constraint "ex_bookings_no_double_booking" exclude using gist ("room_id" with =, "during" with &&) where (cancelled_at is null)\n)`,
      );
      expect(refusal((t) => t.exclude("x", { room_id: "=" }))).toThrow(/exclusive lock/);
    });

    it("refuses an exclusion with no element, a bad operator or method", () => {
      for (const [define, message] of [
        [(t: Blueprint) => t.exclude("x", {}), /at least one element/],
        [(t: Blueprint) => t.exclude("x", { a: "= 1; drop" }), /not an operator/],
        [
          (t: Blueprint) => t.exclude("x", { a: "=" }, { using: "hash" as "gist" }),
          /not gist or btree/,
        ],
      ] as const) {
        class CreateMigration extends Migration {
          up(schema: SchemaBuilder): void {
            schema.create("bookings", (t) => {
              t.uuid("a").notNull().comment("A.");
              define(t);
            });
          }
        }
        expect(() => sqlOf(CreateMigration)).toThrow(message);
      }
    });

    it("drops an index concurrently in its own step, before any built one, with an inverse that builds it again", () => {
      const { steps } = compiledOn((t) => {
        t.index(["status"]).concurrently();
        t.dropIndex(["status"], { using: "btree", where: "status <> 'done'", table: "old_jobs" });
      });
      expect(steps[0]).toEqual({
        sql: ['drop index concurrently if exists "outbox"."idx_old_jobs_status"'],
        transactional: false,
        inverse: [
          `create index concurrently "idx_old_jobs_status" on ${table} using btree ("status") where status <> 'done'`,
        ],
      });
      expect(steps[1]?.sql).toEqual([
        `create index concurrently "idx_jobs_status" on ${table} ("status")`,
      ]);
    });

    it("renames a table behind a security_invoker view under its old name", () => {
      const { steps } = compiledSchema((schema) => schema.rename("old_jobs", "jobs"));
      expect(steps).toEqual([
        {
          sql: [
            "-- lint: an expand step: the view below keeps the old name readable and writable until finishRename (ADR 0159 d3).\n" +
              "-- squawk-ignore renaming-table\n" +
              'alter table "outbox"."old_jobs" rename to "jobs"',
            `create view "outbox"."old_jobs" with (security_invoker = true) as select * from ${table}`,
            `comment on view "outbox"."old_jobs" is 'The old name of outbox.jobs, kept for the release before the rename; dropped by finishRename.'`,
          ],
          transactional: true,
          inverse: [
            'drop view if exists "outbox"."old_jobs"',
            `alter table ${table} rename to "old_jobs"`,
          ],
        },
      ]);
    });

    it("finishes a table rename behind its release gate, and drops a table irreversibly", () => {
      const finish = compiledSchema((schema) =>
        schema.finishRename("old_jobs", "jobs", { after: AFTER }),
      );
      expect(finish.after).toEqual([AFTER]);
      expect(finish.steps[0]?.sql[0]).toContain("'outbox.old_jobs finish rename to jobs'");
      expect(finish.steps[0]?.sql[1]).toBe(
        "-- lint: a contract step: the release gate above refuses it until the release that stopped using the old name has shipped (ADR 0159 d3).\n" +
          "-- squawk-ignore ban-drop-view\n" +
          'drop view "outbox"."old_jobs"',
      );
      expect(finish.steps[0]?.inverse).toEqual([
        `create view "outbox"."old_jobs" with (security_invoker = true) as select * from ${table}`,
      ]);
      const drop = compiledSchema((schema) => schema.drop("old_jobs", { after: AFTER }));
      expect(drop.steps[0]?.sql[0]).toContain("'outbox.old_jobs drop'");
      expect(drop.steps[0]?.sql[1]).toBe(
        "-- lint: a contract step: the release gate above refuses it until the release that stopped using the table has shipped (ADR 0159 d3).\n" +
          "-- squawk-ignore ban-drop-table\n" +
          'drop table "outbox"."old_jobs"',
      );
      expect(drop.steps[0]?.inverse).toBe(false);
    });

    it("refuses a table step without its release, or renamed to itself", () => {
      expect(() => compiledSchema((schema) => schema.drop("jobs", { after: "" }))).toThrow(
        /needs \{ after \}/,
      );
      expect(() =>
        compiledSchema((schema) => schema.finishRename("jobs", "jobs", { after: AFTER })),
      ).toThrow(/itself/);
      expect(() => compiledSchema((schema) => schema.rename("jobs", "jobs"))).toThrow(/itself/);
    });

    it("gates a contract step on a backfill's pending rows, first in the transaction", () => {
      const { steps } = compiledSchema((schema) => {
        schema.requireBackfill("outbox.fill_memo", {
          table: "jobs",
          pending: "memo is null and note is not null",
        });
        schema.table("jobs", (t) => t.change("memo").notNull({ safe: true }));
      });
      const gate = steps[0]?.sql[0] ?? "";
      expect(gate).toMatch(/^do \$\$/);
      expect(gate).not.toMatch(/\n\s*\n/);
      expect(gate).toContain(
        `from (select 1 from ${table} where memo is null and note is not null limit 1001)`,
      );
      expect(gate).toContain(
        "'the backfill outbox.fill_memo has not finished; run it (runBackfill) until it does, then migrate again'",
      );
    });

    it("refuses a backfill gate with a bad key, table or predicate", () => {
      for (const [key, target, pending, message] of [
        ["fill_memo", "jobs", "memo is null", /<module>\.<name>/],
        ["outbox.fill_memo", "Jobs", "memo is null", /database name/],
        ["outbox.fill_memo", "jobs", "memo is null $$", /without \$\$/],
        ["outbox.fill_memo", "jobs", " ", /one line/],
      ] as const)
        expect(() =>
          compiledSchema((schema) => schema.requireBackfill(key, { table: target, pending })),
        ).toThrow(message);
    });
  });
});
