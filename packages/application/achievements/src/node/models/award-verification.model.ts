/**
 * Stackra file contract:
 * Purpose: `AwardVerification`, the cross-scope index of one live award's verify token: the token's SHA-256 hash, the
 *          short code's hash, the award and the scope it lives in, so a stranger's verify request finds the award without a scope session.
 * Boundary: data only. Key `achievements.award_verification`, table `achievements.award_verifications`, the one table
 *           here with no row-level security, by ADR 0368 decision 5: it holds no personal data and no token, only a
 *           hash, an award id and a scope. It is written with its award and deleted on revoke, so a revoked award's
 *           token resolves nothing. Rows are written only by `AwardService`.
 * Runtime: node
 * Governing contract: ADR 0368 (decision 5); ADR 0432 (decision 2); `.agents/rules/tenancy.md` (point 5: the cross-tenant read an ADR names);
 *                     ADR 0294 (decisions 4, 11, 20 and 27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** A verify token's index row. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class AwardVerification extends Model.with(HasPublicId("awv"), Timestamps) {
  /** The SHA-256 of the verify token, lowercase hex. */
  tokenHash!: string;

  /** The SHA-256 of the canonical short code, lowercase hex; null for an award granted before codes. */
  codeHash!: string | null;

  /** The award the token verifies. */
  awardId!: PublicId<"awd">;

  /** The award's scope node. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, the scope session a verify opens to read the award. */
  scopePath!: string;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
/** The props a create of `AwardVerification` may leave out. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface AwardVerification {
  /** The trait timestamps, which the database fills in. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
