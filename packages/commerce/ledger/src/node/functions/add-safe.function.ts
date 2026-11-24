/**
 * Stackra file contract:
 * Purpose: `addSafe`, the sum of two whole amounts, refused instead of rounded when it leaves the safe integers.
 * Boundary: internal; pure. A balance and an amount are each safe integers, but their sum can pass 2^53, where a JavaScript
 *           number silently rounds; the journal compares that sum with a floor and stores it back, so a rounded one would
 *           be a wrong decision about money. As `Money` does, the ledger refuses a result it cannot hold exactly.
 * Runtime: node
 * Governing contract: ADR 0220 (integer minor units); `Money.plus` (a result beyond the safe integers is refused).
 */

/**
 * `left + right`.
 *
 * @throws RangeError when the sum is not a safe integer.
 * @example
 * addSafe(100, -30); // 70
 * addSafe(Number.MAX_SAFE_INTEGER, 1); // throws RangeError
 */
export function addSafe(left: number, right: number): number {
  const sum = left + right;
  if (!Number.isSafeInteger(sum))
    throw new RangeError(`journal: ${left} + ${right} leaves the safe integers`);
  return sum;
}
