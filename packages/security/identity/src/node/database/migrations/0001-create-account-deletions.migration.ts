/**
 * Stackra file contract:
 * Purpose: the first migration of the identity package (`identity.0001_create_account_deletions`): the durable store
 *          of `AccountDeletions`, one row per account deletion a user asked for, from the request until the erasure
 *          starts or the user cancels.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Partitioned by the session's `app.tenant_id` through the generated policy
 *           (`rowLevelSecurity`, `equalsOrUnset`), forced, so a row stays in the tenant whose session asked and a host
 *           without tenancy keeps its rows under a null `scope_id`. One live deletion per subject per partition (the
 *           expression index treats a null scope as one partition). No `down()`: gen derives the dev inverse. No name,
 *           email or reason is stored: the subject's public id is enough.
 * Runtime: node
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0159 (as amended); ADR 0239 (equality on the tenant
 *                     setting; `equalsOrUnset`); `.agents/rules/tenancy.md`; STA-1567.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the account deletions table and its policy. */
export class CreateAccountDeletionsMigration extends Migration {
  /** The table, its partition policy, its due index and the one-per-subject index. */
  up(schema: SchemaBuilder): void {
    schema.create("account_deletions", (t: Blueprint) => {
      t.string("erasure_id", 63)
        .notNull()
        .comment("The id the privacy erasure and its receipt carry (era_).");
      t.string("scope_id", 63)
        .nullable()
        .comment(
          "The tenant whose session asked, from app.tenant_id; null for a session in no tenant.",
        );
      t.string("subject", 63)
        .notNull()
        .comment("The account to delete: the user's public id (usr_).");
      t.timestamp("requested_at").notNull().comment("When the user asked.");
      t.timestamp("due_at")
        .notNull()
        .comment("When the grace period ends and the erasure may start.");
      t.primary(["erasure_id"]);
      t.index(["scope_id", "due_at"]);
      t.rowLevelSecurity("scope_id", { setting: "app.tenant_id", match: "equalsOrUnset" });
    });
    schema.sql(
      'create unique index "uq_account_deletions_scope_subject" on "identity"."account_deletions" ' +
        "((coalesce(scope_id, '-')), subject)",
      { inverse: 'drop index if exists "identity"."uq_account_deletions_scope_subject"' },
    );
  }
}
