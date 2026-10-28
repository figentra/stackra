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
 *          table added NOT VALID and validated in its own step (stackra-251).
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
    expect(step?.sql).toContain(
      `create policy "pol_orders_workspace_id" on "orders"."orders" using ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid) with check ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid)`,
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

  it.each([
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
    expect(step?.inverse).toEqual([
      'drop table if exists "loyalty"."accounts"',
      'drop extension if exists "pg_trgm"',
    ]);
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
});
