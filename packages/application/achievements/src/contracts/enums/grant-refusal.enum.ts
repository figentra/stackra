/**
 * Stackra file contract:
 * Purpose: `GrantRefusal`, why an award of a kind cannot be granted to a recipient: the kind is archived, the recipient
 *          is of another model, the level is missing, unknown or not above the recipient's highest, or the period is
 *          missing or already awarded.
 * Boundary: an `Enum.of` value plus the type of the same name. `checkGrant` returns one; `AwardNotGrantableError`
 *           carries it. The words a person reads are the consumer's catalogue, keyed by the code.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 3); ADR 0294 (decision 16: `Enum.of`); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The reasons a grant is refused. */
export const GrantRefusal = Enum.of({
  /** The kind is archived: no new award of it. */
  KindArchived: "kind_archived",
  /** The recipient is a record of another model than the kind's. */
  RecipientMismatch: "recipient_mismatch",
  /** The kind has levels and none was given. */
  LevelRequired: "level_required",
  /** The level is not one of the kind's. */
  LevelUnknown: "level_unknown",
  /** The kind is ascending and the level is not above the recipient's highest live level. */
  LevelNotHigher: "level_not_higher",
  /** The kind is once per period and no period was given. */
  PeriodRequired: "period_required",
  /** The recipient already holds a live award of the kind for the period. */
  PeriodTaken: "period_taken",
});

/** One of the codes above. */
export type GrantRefusal = Enum.Value<typeof GrantRefusal>;
