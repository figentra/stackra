/**
 * Stackra file contract:
 * Purpose: the first table of the iam package, `iam.policy_snapshots`: a consuming service's copy of each principal's
 *          policy snapshot, one row per tenant and principal, kept by the Postgres `PolicySnapshotStore` driver.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database's migration API and every
 *           name is a literal. Tenant-scoped by the forced equality policy on `app.tenant_id` (ADR 0239), written
 *           with the database package's own `rowLevelSecurity`, because @stackra/iam does not depend on
 *           @stackra/tenancy; `-` is the partition of platform principals (no tenant). No personal data: the
 *           principal is a public id and the snapshot holds role keys, scope references and rule data. No `down()`:
 *           gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0159 (as amended); ADR 0239; ADR 0407; STA-815.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the policy snapshot table. */
export class CreatePolicySnapshotsMigration extends Migration {
  /** The table, keyed by tenant and principal, with its tenant policy. */
  up(schema: SchemaBuilder): void {
    schema.create("policy_snapshots", (t: Blueprint) => {
      t.timestamps();
      t.string("tenant_id", 63)
        .notNull()
        .comment("The tenant the snapshot was issued in; - for a platform principal.");
      t.string("principal", 63).notNull().comment("The principal's public id.");
      t.integer("version")
        .notNull()
        .comment("The snapshot's version; only a higher one replaces it.");
      t.jsonb("snapshot").notNull().comment("The policy snapshot as the IAM event carried it.");
      t.primary(["tenant_id", "principal"]);
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equals" });
    });
  }
}
