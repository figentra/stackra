/**
 * Stackra file contract:
 * Purpose: the second migration of the payments package (`payments.0002_create_connected_account_limits`): the limits
 *          the platform sets on each `connected-account` connection (its pre-verification cap and whether its payouts
 *          are held), and the audit history of every change to them.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Both tables are partitioned by the session's `app.tenant_id` through the generated policy
 *           (`rowLevelSecurity`, `equalsOrUnset`), forced; the platform sets a tenant's limits in that tenant's session.
 *           One live row per connection per partition; the history is append-only (the driver only inserts). No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: R4-6; M3-2; ADR 0159 (as amended); ADR 0239; `.agents/rules/tenancy.md`; STA-1707.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the limits table, its change history and their policies. */
export class CreateConnectedAccountLimitsMigration extends Migration {
  /** The two tables, their partition policies, the one-per-connection index and the history index. */
  up(schema: SchemaBuilder): void {
    schema.create("connected_account_limits", (t: Blueprint) => {
      t.string("connection_id", 63).notNull().comment("The connected-account connection.");
      t.string("scope_id", 63)
        .nullable()
        .comment("The tenant that owns the connection, from app.tenant_id; null outside one.");
      t.money("cap").nullable().comment("The most one payment may take; null when no cap applies.");
      t.boolean("payout_held").notNull().comment("Whether its payouts are held.");
      t.string("set_by", 63).notNull().comment("The platform principal who set them.");
      t.string("reason", 1000).notNull().comment("Why they were set.");
      t.timestamp("set_at").notNull().comment("When they were set.");
      t.rowLevelSecurity("scope_id", { setting: "app.tenant_id", match: "equalsOrUnset" });
    });
    schema.sql(
      'create unique index "uq_connected_account_limits_scope_connection" on ' +
        '"payments"."connected_account_limits" ((coalesce(scope_id, \'-\')), connection_id)',
      {
        inverse: 'drop index if exists "payments"."uq_connected_account_limits_scope_connection"',
      },
    );
    schema.create("connected_account_limit_changes", (t: Blueprint) => {
      t.string("connection_id", 63).notNull().comment("The connected-account connection.");
      t.string("scope_id", 63)
        .nullable()
        .comment("The tenant that owns the connection, from app.tenant_id; null outside one.");
      t.money("cap").nullable().comment("The cap set; null for none.");
      t.boolean("payout_held").notNull().comment("The hold set.");
      t.string("set_by", 63).notNull().comment("The platform principal who set them.");
      t.string("reason", 1000).notNull().comment("Why they were set.");
      t.timestamp("set_at").notNull().comment("When they were set.");
      t.index(["scope_id", "connection_id", "set_at"]);
      t.rowLevelSecurity("scope_id", { setting: "app.tenant_id", match: "equalsOrUnset" });
    });
  }
}
