/**
 * Stackra file contract:
 * Purpose: the first migration of the privacy package (`privacy.0001_create_subject_salts`): the `privacy.subject_salts`
 *          table that `PostgresSubjectSaltStoreDriver` keeps each data subject's random salt in, one row per scope and
 *          subject, under a forced row-level-security policy.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Rows are partitioned by the session's `app.tenant_id` (`-` for a session in no tenant, so a host
 *           without tenancy still works): the policy is written with `schema.sql` because the built-in equality match
 *           hides every row from a session with the setting unset. @stackra/privacy does not depend on
 *           @stackra/tenancy, so no `belongsToTenant`. The salt is base64 text (32 bytes), never logged or exported.
 *           Erasure deletes the row; the key it derived is then gone. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, comments and nullability, `schema.sql` with `inverse`); ADR 0188
 *                     (decision 2); ADR 0212 (crypto-shredding); ADR 0239 (equality on the tenant setting); gap gov2
 *                     (stackra-263).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The session's partition: its tenant, or `-` outside one. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/** Creates the subject salt table and its policy. */
export class CreateSubjectSaltsMigration extends Migration {
  /** The table keyed by scope and subject, then row-level security forced on its partition. */
  up(schema: SchemaBuilder): void {
    schema.create("subject_salts", (t: Blueprint) => {
      t.string("scope_id", 63)
        .notNull()
        .comment(
          "The tenant the salt belongs to, from app.tenant_id; - for a session in no tenant.",
        );
      t.string("subject", 63).notNull().comment("The data subject's public id.");
      t.string("salt", 64)
        .notNull()
        .comment("The subject's random salt, base64; the subject key is derived from it.");
      t.timestamp("created_at").notNull().comment("When the subject's first field was sealed.");
      t.primary(["scope_id", "subject"]);
    });
    schema.sql('alter table "privacy"."subject_salts" enable row level security', {
      inverse: 'alter table "privacy"."subject_salts" disable row level security',
    });
    schema.sql('alter table "privacy"."subject_salts" force row level security', {
      inverse: 'alter table "privacy"."subject_salts" no force row level security',
    });
    schema.sql(
      'create policy "pol_subject_salts_scope_id" on "privacy"."subject_salts" ' +
        `using ("scope_id" = ${PARTITION}) with check ("scope_id" = ${PARTITION})`,
      {
        inverse: 'drop policy if exists "pol_subject_salts_scope_id" on "privacy"."subject_salts"',
      },
    );
  }
}
