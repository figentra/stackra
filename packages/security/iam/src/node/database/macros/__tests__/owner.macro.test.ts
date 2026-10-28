/**
 * Stackra file contract:
 * Purpose: unit tests of `OwnerMacro`: installed as `t.owner`, it writes a commented, nullable `owner_id varchar(33)`
 *          with its index and no foreign key, on a new table and on an existing one.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321 (decision 4); ADR 0159 as amended by ADR 0305.
 */
import { compileMigration, Macro, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { OwnerMacro } from "#node/database/macros/owner.macro";

/** The SQL of a migration that creates (or changes) `tickets` with `t.owner()`. */
function compiled(creating: boolean): string {
  class TicketsMigration extends Migration {
    up(schema: SchemaBuilder): void {
      const define = (t: Blueprint) => {
        if (creating) t.hasPublicId("tkt");
        t.owner();
      };
      if (creating) schema.create("tickets", define);
      else schema.table("tickets", define);
    }
  }
  return compileMigration(TicketsMigration, { schema: "support", macros: [OwnerMacro] })
    .steps.flatMap((step) => step.sql)
    .join("\n");
}

describe(OwnerMacro, () => {
  it("is a macro", () => {
    expect(new OwnerMacro()).toBeInstanceOf(Macro);
  });

  it("writes the commented nullable owner column with its index and no foreign key", () => {
    for (const creating of [true, false]) {
      const sql = compiled(creating);
      expect(sql).toContain('"owner_id" varchar(33) null');
      expect(sql).toContain('comment on column "support"."tickets"."owner_id" is \'The principal');
      expect(sql).toContain('"idx_tickets_owner_id"');
      expect(sql).not.toContain('"fk_tickets_owner_id"');
    }
  });
});
