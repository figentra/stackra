/**
 * Stackra file contract:
 * Purpose: `tenancy.tenant_data_keys`, each tenant's wrapped data keys (ADR 0188 decision 2, amendment 2026-11-09),
 *          with the forced tenant policy, one row per (tenant, version) and no UPDATE.
 * Boundary: a frozen snapshot of `tenancy.tenant_data_key`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. Every column states its nullability and a comment equal to
 *           the model field's docblock. `belongsToTenant` writes the tenant column, its index and the forced equality
 *           policy; `appendOnly` revokes UPDATE. No `down()`: gen derives the dev inverse; production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability); ADR 0188 (the
 *                     2026-11-09 amendment); ADR 0239; ADR 0231 (index and constraint names).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the tenant data key table. */
export class CreateTenantDataKeysMigration extends Migration {
  /** The table with its tenant policy, one key per (tenant, version) and no UPDATE. */
  up(schema: SchemaBuilder): void {
    schema.create("tenant_data_keys", (t: Blueprint) => {
      t.hasPublicId("tdk");
      t.belongsToTenant();
      t.integer("version")
        .notNull()
        .comment("The key's version in its tenant, from 1; the highest is current.");
      t.string("key_id", 16)
        .notNull()
        .comment("The key's id, `k<version>`, which data sealed under it names.");
      t.string("wrapped", 512)
        .notNull()
        .comment("The KMS ciphertext of the 256-bit data key, base64url.");
      t.unique(["tenant_id", "version"]);
      t.appendOnly();
    });
  }
}
