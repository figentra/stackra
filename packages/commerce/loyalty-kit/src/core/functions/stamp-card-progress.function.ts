/**
 * Stackra file contract:
 * Purpose: `stampCardProgress`, a stamp balance read as a card: the stamps on the card being filled and the full cards
 *          ready to redeem, for the renderers and the till.
 * Boundary: pure; the card size is the `stampsPerCard` setting, passed in. A negative balance (a correction) shows an
 *           empty card.
 * Runtime: isomorphic
 * Governing contract: the PUT-133 answer (stamp cards); ADR 0294 (decisions 2 and 15).
 */
import type { StampCardProgress } from "#core/types/stamp-card-progress.type";

/**
 * The card a balance fills.
 *
 * @example
 * stampCardProgress(23, 10); // { stamps: 3, perCard: 10, fullCards: 2 }
 * @throws RangeError when `perCard` is not a positive integer or `balance` is not an integer.
 */
export function stampCardProgress(balance: number, perCard: number): StampCardProgress {
  if (!Number.isInteger(perCard) || perCard < 1)
    throw new RangeError(
      `stampCardProgress: a card holds a positive number of stamps, got ${perCard}`,
    );
  if (!Number.isInteger(balance))
    throw new RangeError(`stampCardProgress: the balance must be whole stamps, got ${balance}`);
  const stamps = Math.max(balance, 0);
  return { stamps: stamps % perCard, perCard, fullCards: Math.floor(stamps / perCard) };
}
