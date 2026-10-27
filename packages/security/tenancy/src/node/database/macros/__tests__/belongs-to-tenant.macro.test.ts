/**
 * Stackra file contract:
 * Purpose: unit tests of `BelongsToTenantMacro`: installed as `t.belongsToTenant`, the bare call writes a commented,
 *          NOT NULL `tenant_id varchar(33)` with its index and no foreign key, then ENABLE, FORCE and the equality
 *          policy `pol_<table>_tenant_id` on `app.tenant_id`; on an existing table the compiler refuses it (a backfill
 *          migration instead); a second policy on the same table is refused. The nullable form writes a nullable
 *          column under the `equalsOrUnset` match, so NULL rows are the platform call's, for reads and writes
 *          (@stackra/database's `equalsOrUnset`, STA-1300; STA-1312).
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
): string {
  class TicketsMigration extends Migration {
    up(schema: SchemaBuilder): void {
      const define = (t: Blueprint) => {
        if (creating) t.hasPublicId("tkt");
        t.belongsToTenant({ nullable });
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

  it("adds the nullable form to an existing table, whose rows become the platform's", () => {
    expect(compiled(false, undefined, true)).toContain('"pol_tickets_tenant_id"');
  });
});
