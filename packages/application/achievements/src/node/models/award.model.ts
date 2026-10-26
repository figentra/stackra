/**
 * Stackra file contract:
 * Purpose: `Award`, one award of a kind granted to one recipient: the kind, the recipient by model key and public id,
 *          the level and period, the reason, who granted it (null for its criteria), the criteria revision that
 *          matched, its verify token and short code, and when and why it was revoked.
 * Boundary: data only. Key `achievements.award`, table `achievements.awards`, under forced row-level security on
 *           `scope_path` (the scope it was granted in). `createdAt` is when it was granted. The verify token is kept
 *           here so a certificate can be printed again; the cross-scope lookup holds only its hash
 *           (`AwardVerification`). Rows are written only by `AwardService`, which records `AwardGranted` and
 *           `AwardRevoked`; the ORM loads rows without the constructor.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 2 to 5); ADR 0327 (decisions 3 and 9); ADR 0294 (decisions 4, 11, 20 and
 *                     27); ADR 0135 (public ids); ADR 0432 (decisions 2 and 3: the code, one live award per period).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** An award. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Award extends Model.with(HasPublicId("awd"), Timestamps) {
  /** The kind of the award. */
  kindId!: PublicId<"awk">;

  /** The scope node it was granted in. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The recipient model's key (`workforce.member`). */
  recipientModel!: string;

  /** The recipient's public id. */
  recipientId!: string;

  /** The level granted; null for a kind with no levels. */
  level!: string | null;

  /** The period granted for (`2026-09`); null for a kind that is not once per period. */
  period!: string | null;

  /** Why it was granted, as the granting person wrote it; null when none was given. */
  reason!: string | null;

  /** The principal who granted it; null when its kind's criteria did. */
  grantedBy!: string | null;

  /** The criteria revision that matched; null for a grant by hand. */
  ruleRevision!: number | null;

  /** The opaque verify token printed on its certificate and QR code. */
  verifyToken!: string;

  /** The short verify code printed beside the QR code (`7K3Q-9XPM-0ABZ`); null for an award granted before codes. */
  verifyCode!: string | null;

  /** When it was revoked; null while it is live. */
  revokedAt!: Date | null;

  /** Why it was revoked; null while it is live. */
  revokedReason!: string | null;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
/** The props a create of `Award` may leave out. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Award {
  /** The trait timestamps, which the database fills in. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
