/**
 * Stackra file contract:
 * Purpose: `checkGrant`, why an award of a kind cannot be granted, or null: the kind is archived, the recipient is of
 *          another model, the level is missing or unknown, an ascending kind's level is not above the recipient's
 *          highest live level, or a once-per-period kind's period is missing or already awarded.
 * Boundary: pure and isomorphic, so a form previews the refusal with the server's code. `live` is the recipient's
 *           unrevoked awards of this kind; the caller reads them. Which kinds have levels, ascend or repeat per period
 *           is kind data, never code here.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decisions 2 and 3); ported behaviour (ORIGIN.md).
 */
import { GrantRefusal } from "#contracts/index";

/**
 * The refusal of a grant, or null when it may go ahead.
 *
 * @example
 * const refusal = checkGrant(kind, { recipientModel, level: "blue", period: null }, live);
 * if (refusal !== null) throw AwardNotGrantableError.create({ kindId: kind.id, reason: refusal });
 */
export function checkGrant(
  kind: {
    readonly isActive: boolean;
    readonly recipientModel: string;
    readonly levels: readonly string[];
    readonly isAscending: boolean;
    readonly isOncePerPeriod: boolean;
  },
  grant: {
    readonly recipientModel: string;
    readonly level: string | null;
    readonly period: string | null;
  },
  live: readonly { readonly level: string | null; readonly period: string | null }[],
): GrantRefusal | null {
  if (!kind.isActive) return GrantRefusal.KindArchived;
  if (grant.recipientModel !== kind.recipientModel) return GrantRefusal.RecipientMismatch;
  if (kind.levels.length > 0) {
    if (grant.level === null) return GrantRefusal.LevelRequired;
    const rank = kind.levels.indexOf(grant.level);
    if (rank < 0) return GrantRefusal.LevelUnknown;
    const highest = Math.max(
      -1,
      ...live.map((award) => (award.level === null ? -1 : kind.levels.indexOf(award.level))),
    );
    if (kind.isAscending && rank <= highest) return GrantRefusal.LevelNotHigher;
  }
  if (kind.isOncePerPeriod) {
    if (grant.period === null || grant.period.trim() === "") return GrantRefusal.PeriodRequired;
    if (live.some((award) => award.period === grant.period)) return GrantRefusal.PeriodTaken;
  }
  return null;
}
