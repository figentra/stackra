/**
 * Stackra file contract:
 * Purpose: the first migration of the payments package (`payments.0001_create_payment_records`): the durable store of
 *          `PaymentRecords`, one row per merchant reference with where it stands and what the engine needs to look it
 *          up before a retry.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Partitioned by the session's `app.tenant_id` through the generated policy
 *           (`rowLevelSecurity`, `equalsOrUnset`), forced, so a row stays in the tenant whose session wrote it and a
 *           host without tenancy keeps its rows under a null `scope_id`. One record per reference per partition (the
 *           expression index treats a null scope as one partition). Each amount is minor units and its own currency
 *           (`money`). No card number is stored: a saved method is the provider's token. No `down()`: gen derives the
 *           dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0239 (equality on the tenant setting; `equalsOrUnset`); ADR 0357
 *                     (decision 6); `.agents/rules/tenancy.md`; STA-1706.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the payment records table and its policy. */
export class CreatePaymentRecordsMigration extends Migration {
  /** The table, its partition policy and the one-per-reference index. */
  up(schema: SchemaBuilder): void {
    schema.create("payment_records", (t: Blueprint) => {
      t.string("reference", 255).notNull().comment("The merchant's id of the payment.");
      t.string("scope_id", 63)
        .nullable()
        .comment(
          "The tenant whose session wrote it, from app.tenant_id; null for a session in no tenant.",
        );
      t.string("provider", 63).notNull().comment("The provider code of the serving connection.");
      t.string("connection_id", 63).notNull().comment("The serving connection's id.");
      t.string("provider_ref", 255).nullable().comment("The provider's id, once known.");
      t.string("status", 31).notNull().comment("Where it stands (PaymentStatus).");
      t.money("amount").notNull().comment("The amount before any tip.");
      t.money("tip").nullable().comment("The tip; null when there is none.");
      t.money("refunded").notNull().comment("What has been refunded so far.");
      t.string("terminal_id", 255).nullable().comment("The terminal, for a terminal payment.");
      t.jsonb("session").nullable().comment("The open checkout, for a hosted or pay-link payment.");
      t.jsonb("method")
        .nullable()
        .comment("The provider token saved with it, when the customer agreed.");
      t.jsonb("resolution").nullable().comment("How an unknown state was settled by hand.");
      t.jsonb("agent")
        .nullable()
        .comment("The protocol and agent of a wallet-confirmed agent payment.");
      t.timestamp("updated_at").notNull().comment("When the record last changed.");
      t.index(["scope_id", "provider_ref"]);
      t.rowLevelSecurity("scope_id", { setting: "app.tenant_id", match: "equalsOrUnset" });
    });
    schema.sql(
      'create unique index "uq_payment_records_scope_reference" on "payments"."payment_records" ' +
        "((coalesce(scope_id, '-')), reference)",
      { inverse: 'drop index if exists "payments"."uq_payment_records_scope_reference"' },
    );
  }
}
