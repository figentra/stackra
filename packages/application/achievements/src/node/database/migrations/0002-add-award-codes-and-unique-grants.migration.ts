/**
 * Stackra file contract:
 * Purpose: the short verify code and the unique grant: `achievements.awards.verify_code` (the printed code, for a
 *          reprint), `achievements.award_verifications.code_hash` (its SHA-256, unique) and a partial unique index on
 *          live awards per kind, recipient and period, so two concurrent grants for one period cannot both commit.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Both new columns are nullable because awards granted before it have no code; every new grant
 *           writes one. The unique index covers only live awards with a period (a revoked award frees its period;
 *           kinds without a period are checked by `checkGrant`). The tables exist, so each index builds
 *           online in its own step; the period index fails to build if live duplicates already exist, which an
 *           operator resolves by revoking one. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0432 (decisions 2 and 3); ADR 0368 (decisions 3 and 5); ADR 0159 (as amended).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the code columns and the unique live-period index. */
export class AddAwardCodesAndUniqueGrantsMigration extends Migration {
  /** The two columns, then the two unique indexes. */
  up(schema: SchemaBuilder): void {
    schema.table("awards", (t: Blueprint) => {
      t.string("verify_code", 14)
        .nullable()
        .comment("The short verify code printed beside the QR code.");
      t.unique(["kind_id", "recipient_id", "period"])
        .where("revoked_at is null and period is not null")
        .concurrently();
    });
    schema.table("award_verifications", (t: Blueprint) => {
      t.string("code_hash", 64)
        .nullable()
        .comment("The SHA-256 of the canonical short verify code, lowercase hex.");
      t.unique(["code_hash"]).concurrently();
    });
  }
}
