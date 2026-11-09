/**
 * Stackra file contract:
 * Purpose: the seventh migration of the outbox package (`outbox.0007_revoke_secure_change_partition`): revokes every
 *          privilege on `outbox.secure_change_partition(text)` from `PUBLIC`, so only its owner (the migrating role,
 *          the service's own) runs it.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *          literal. Defence in depth: the function has invoker rights, so a caller already needs the rights to alter
 *          the partition it names; `ChangeFeed.maintain` runs as the owner and keeps calling it. The dev inverse
 *          grants `EXECUTE` back to `PUBLIC`, the default it had.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap C: the partitioned change log); ADR 0159 (as amended).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Revokes the partition helper from `PUBLIC`. */
export class RevokeSecureChangePartitionMigration extends Migration {
  /** The one revoke. */
  up(schema: SchemaBuilder): void {
    schema.sql("revoke all on function outbox.secure_change_partition(text) from public", {
      inverse: "grant execute on function outbox.secure_change_partition(text) to public",
    });
  }
}
