/**
 * Stackra file contract:
 * Purpose: the fourth migration of the access-log package: replaces the classification check of
 *          `access_log.access_log_entries` so it accepts `credential` (ADR 0494), and `regulated` on a table created
 *          before STA-1300. Without it a credential read on an existing install could not write its access record, and
 *          since such a read fails closed, it would be refused.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name and code is a
 *           literal. The new check is added `not valid`: every existing row already passed the narrower check it
 *           replaces, so no scan or long lock is needed. The inverse restores the check without `credential`.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, expand-only); ADR 0134 and ADR 0494 (the classification codes);
 *                     ADR 0231 (check names).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Widens the access record's classification check to the codes of ADR 0494. */
export class CredentialClassificationMigration extends Migration {
  /** One statement: drop the old check and add the wider one, unvalidated. */
  up(schema: SchemaBuilder): void {
    schema.sql(
      `alter table "access_log"."access_log_entries" drop constraint if exists "ck_access_log_entries_classification", add constraint "ck_access_log_entries_classification" check ("classification" in ('personal', 'financial', 'health', 'pseudonymous', 'regulated', 'credential')) not valid`,
      {
        inverse: `alter table "access_log"."access_log_entries" drop constraint if exists "ck_access_log_entries_classification", add constraint "ck_access_log_entries_classification" check ("classification" in ('personal', 'financial', 'health', 'pseudonymous', 'regulated')) not valid`,
      },
    );
  }
}
