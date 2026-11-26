/**
 * Stackra file contract:
 * Purpose: the first migration of the "Tenancy in an app" guide's `support` module: the tenant-owned `tickets` table.
 *          `t.belongsToTenant()` (the macro of `@stackra/tenancy/node`) writes `tenant_id`, its index, ENABLE and FORCE
 *          row-level security and the one equality policy on `app.tenant_id`.
 * Boundary: a frozen snapshot that uses only `@stackra/database` and the tenancy macro; every name is a literal.
 * Runtime: node
 * Governing contract: ADR 0159; ADR 0239 (the equality policy); ADR 0347; STA-2843.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the tickets table, owned by a tenant. */
export class CreateTicketsMigration extends Migration {
  /** The table, its tenant column and policy, and its columns. */
  up(schema: SchemaBuilder): void {
    schema.create("tickets", (t: Blueprint) => {
      t.hasPublicId("tkt");
      t.belongsToTenant();
      t.timestamps();
      t.string("subject", 200).notNull().comment("What the customer asked about.");
      t.string("status", 20).notNull().default("open").comment("open or resolved.");
    });
  }
}
