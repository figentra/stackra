/**
 * Stackra file contract:
 * Purpose: unit tests of `BelongsToTenantMacro`: installed as `t.belongsToTenant`, the bare call writes a commented,
 *          NOT NULL `tenant_id varchar(33)` with its index and no foreign key, then ENABLE, FORCE and the equality
 *          policy `pol_<table>_tenant_id` on `app.tenant_id`; on an existing table the compiler refuses it (a backfill
 *          migration instead); a second policy on the same table is refused. The nullable form writes a nullable
 *          column under the `equalsOrUnset` match, so NULL rows are the platform call's, for reads and writes
 *          (@stackra/database's `equalsOrUnset`, STA-1300; STA-1312). The expand form adds only a nullable column
 *          defaulting to `app.tenant_id` to an existing table, beside the policy it already has. The contract form sets
 *          the existing column NOT NULL and writes the equality policy; with `nullable` it is the platform form's contract
 *          (the column stays nullable, under the `platform` match); it is refused with `expand`. The pivot form adds a
 *          default read from `app.tenant_id` to the bare form, and is refused with any other form.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; ADR 0159 as amended by ADR 0305; ADR 0231.
 */
import { compileMigration, Macro, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";

/** The SQL of a migration that creates (or changes) `tickets` with `t.belongsToTenant()` and `extra`. */
function compiled(
  creating: boolean,
  extra: (t: Blueprint) => void = () => undefined,
  nullable = false,
  expand = false,
): string {
  class TicketsMigration extends Migration {
    up(schema: SchemaBuilder): void {
      const define = (t: Blueprint) => {
        if (creating) t.hasPublicId("tkt");
        t.belongsToTenant({ nullable, expand });
        extra(t);
      };
      if (creating) schema.create("tickets", define);
      else schema.table("tickets", define);
    }
  }
  return compileMigration(TicketsMigration, { schema: "support", macros: [BelongsToTenantMacro] })
    .steps.flatMap((step) => step.sql)
    .join("\n");
}

describe(BelongsToTenantMacro, () => {
  it("is a macro", () => {
    expect(new BelongsToTenantMacro()).toBeInstanceOf(Macro);
  });

  it("writes the commented NOT NULL tenant column with its index and no foreign key", () => {
    const sql = compiled(true);
    expect(sql).toContain('"tenant_id" varchar(33) not null');
    expect(sql).toContain(
      'comment on column "support"."tickets"."tenant_id" is \'The owning tenant',
    );
    expect(sql).toContain('"idx_tickets_tenant_id"');
    expect(sql).not.toContain('"fk_tickets_tenant_id"');
  });

  it("enables and forces row-level security with the equality policy on app.tenant_id", () => {
    const sql = compiled(true);
    expect(sql).toContain('alter table "support"."tickets" enable row level security');
    expect(sql).toContain('alter table "support"."tickets" force row level security');
    expect(sql).toContain(
      `create policy "pol_tickets_tenant_id" on "support"."tickets" using ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
    );
  });

  it("is refused on an existing table, where a backfill migration adds tenancy", () => {
    expect(() => compiled(false)).toThrow(TypeError);
  });

  it("leaves the table no second policy", () => {
    expect(() =>
      compiled(true, (t) => {
        t.scopePath().notNull().comment("The row's scope path.");
        t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
      }),
    ).toThrow(TypeError);
  });

  it("writes the nullable form: a nullable column whose NULL rows only a platform call reaches", () => {
    const sql = compiled(true, undefined, true);
    expect(sql).toContain('"tenant_id" varchar(33) null');
    expect(sql).toContain("or NULL for a platform row");
    expect(sql).toContain('alter table "support"."tickets" force row level security');
    expect(sql).toContain(
      `create policy "pol_tickets_tenant_id" on "support"."tickets" using ("tenant_id" is not distinct from nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("tenant_id" is not distinct from nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
    );
    expect(sql).not.toContain('"tenant_id" = nullif');
  });

  it("writes the pivot form: the NOT NULL column with a default read from the call's tenant, and the policy", () => {
    class TicketTagsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.create("ticket_tags", (t: Blueprint) => {
          t.belongsToTenant({ pivot: true });
        });
      }
    }
    const sql = compileMigration(TicketTagsMigration, {
      schema: "support",
      macros: [BelongsToTenantMacro],
    })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain(
      `"tenant_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')::varchar(33) not null`,
    );
    expect(sql).toContain('"pol_ticket_tags_tenant_id"');
  });

  it.each([{ nullable: true }, { expand: true }, { contract: true }])(
    "refuses the pivot form with %o",
    (other) => {
      class BadPivotMigration extends Migration {
        up(schema: SchemaBuilder): void {
          schema.create("ticket_tags", (t: Blueprint) => {
            t.belongsToTenant({ pivot: true, ...other });
          });
        }
      }
      expect(() =>
        compileMigration(BadPivotMigration, { schema: "support", macros: [BelongsToTenantMacro] }),
      ).toThrow(/takes no nullable, expand or contract/);
    },
  );

  it("adds the nullable form to an existing table, whose rows become the platform's", () => {
    expect(compiled(false, undefined, true)).toContain('"pol_tickets_tenant_id"');
  });

  it("adds the expand form to an existing table: a nullable column filled from the call, and no policy", () => {
    const sql = compiled(false, undefined, false, true);
    expect(sql).toContain(
      `alter table "support"."tickets" add column "tenant_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')::varchar(33) null`,
    );
    expect(sql).toContain("until backfilled");
    expect(sql).toContain('create index concurrently "idx_tickets_tenant_id"');
    expect(sql).not.toContain("policy");
    expect(sql).not.toContain("row level security");
  });

  it("keeps the expand form beside a policy the same blueprint declares", () => {
    const sql = compiled(
      true,
      (t) => {
        t.scopePath().notNull().comment("The row's scope path.");
        t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
      },
      false,
      true,
    );
    expect(sql).toContain('"pol_tickets_scope_path"');
    expect(sql).not.toContain('"pol_tickets_tenant_id"');
  });

  it("writes the contract form on an existing table: NOT NULL and the equality policy, no new column", () => {
    class ContractTicketsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("tickets", (t: Blueprint) => {
          t.dropRowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
          t.belongsToTenant({ contract: true });
        });
      }
    }
    const sql = compileMigration(ContractTicketsMigration, {
      schema: "support",
      macros: [BelongsToTenantMacro],
    }).steps.flatMap((step) => step.sql);
    expect(sql).toEqual([
      'alter table "support"."tickets" alter column "tenant_id" set not null',
      'drop policy "pol_tickets_scope_path" on "support"."tickets"',
      'alter table "support"."tickets" enable row level security',
      'alter table "support"."tickets" force row level security',
      `create policy "pol_tickets_tenant_id" on "support"."tickets" using ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
    ]);
  });

  it("writes the safe contract form: NOT NULL through a NOT VALID check, validated in a later step", () => {
    class SafeContractTicketsMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("tickets", (t: Blueprint) => {
          t.belongsToTenant({ contract: true, safeNotNull: true });
        });
      }
    }
    const steps = compileMigration(SafeContractTicketsMigration, {
      schema: "support",
      macros: [BelongsToTenantMacro],
    }).steps;
    const table = '"support"."tickets"';
    const check = '"ck_tickets_tenant_id_not_null"';
    expect(steps.map((step) => step.sql)).toEqual([
      [
        `alter table ${table} add constraint ${check} check ("tenant_id" is not null) not valid`,
        `alter table ${table} enable row level security`,
        `alter table ${table} force row level security`,
        `create policy "pol_tickets_tenant_id" on ${table} using ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
      ],
      [
        `alter table ${table} validate constraint ${check}`,
        `alter table ${table} alter column "tenant_id" set not null`,
        `alter table ${table} drop constraint ${check}`,
      ],
    ]);
    expect(steps.map((step) => step.transactional)).toEqual([true, true]);
  });

  it.each([
    [{ safeNotNull: true }],
    [{ safeNotNull: true, expand: true }],
    [{ safeNotNull: true, contract: true, nullable: true }],
  ])("refuses safeNotNull outside the non-nullable contract step: %o", (options) => {
    class BadMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("tickets", (t: Blueprint) => t.belongsToTenant(options));
      }
    }
    expect(() =>
      compileMigration(BadMigration, { schema: "support", macros: [BelongsToTenantMacro] }),
    ).toThrow(/safeNotNull/);
  });

  it("writes the platform form's contract: the column stays nullable, under the platform match", () => {
    class ContractNoticesMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("tickets", (t: Blueprint) =>
          t.belongsToTenant({ contract: true, nullable: true }),
        );
      }
    }
    const sql = compileMigration(ContractNoticesMigration, {
      schema: "support",
      macros: [BelongsToTenantMacro],
    }).steps.flatMap((step) => step.sql);
    const own = `"tenant_id" is not distinct from nullif(current_setting('app.tenant_id', true), '')::varchar(33)`;
    expect(sql).not.toContain(
      'alter table "support"."tickets" alter column "tenant_id" set not null',
    );
    expect(sql).toContain(
      `create policy "pol_tickets_tenant_id" on "support"."tickets" using ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33) or "tenant_id" is null) with check (${own})`,
    );
    expect(sql).toContain(
      `create policy "pol_tickets_tenant_id_write_update" on "support"."tickets" as restrictive for update using (${own})`,
    );
    expect(sql).toContain(
      `create policy "pol_tickets_tenant_id_write_delete" on "support"."tickets" as restrictive for delete using (${own})`,
    );
  });

  it("refuses the contract form with expand", () => {
    class BadMigration extends Migration {
      up(schema: SchemaBuilder): void {
        schema.table("tickets", (t: Blueprint) =>
          t.belongsToTenant({ contract: true, expand: true }),
        );
      }
    }
    expect(() =>
      compileMigration(BadMigration, { schema: "support", macros: [BelongsToTenantMacro] }),
    ).toThrow(/does not take expand/);
  });
});
