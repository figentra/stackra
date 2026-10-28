/**
 * Stackra file contract:
 * Purpose: `approvalNumbers`, the number an app approval shows on the requesting device and the choices the app
 *          offers: the number plus `decoys` other numbers of the same digit count, all distinct, in random order.
 * Boundary: internal; reads `crypto.getRandomValues` with rejection sampling, never `Math.random`, so no number is
 *           likelier than another. The digit count and the decoy count are `IdentityConfig` values; the schema keeps
 *           the decoys well inside the numbers there are.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27: two digits, three decoys by default).
 */

/** A uniform random whole number in `[0, below)`. */
function randomBelow(below: number): number {
  const limit = Math.floor(0x1_00_00_00_00 / below) * below;
  const word = new Uint32Array(1);
  let value: number;
  do value = crypto.getRandomValues(word)[0] ?? limit;
  while (value >= limit);
  return value % below;
}

/**
 * The number and the shuffled choices.
 *
 * @throws RangeError when the digits cannot hold the number and its decoys.
 * @example
 * approvalNumbers(2, 3); // { number: 47, choices: [12, 47, 88, 30] }
 */
export function approvalNumbers(
  digits: number,
  decoys: number,
): { readonly number: number; readonly choices: readonly number[] } {
  const low = 10 ** (digits - 1);
  const size = 10 ** digits - low;
  if (decoys + 1 > size) throw new RangeError(`${digits} digits cannot hold ${decoys} decoys`);
  const picked = new Set<number>();
  while (picked.size < decoys + 1) picked.add(low + randomBelow(size));
  const [number = low] = picked;
  const choices: number[] = [];
  // Inside-out Fisher-Yates: each pick lands at a uniform position.
  for (const value of picked) choices.splice(randomBelow(choices.length + 1), 0, value);
  return { number, choices };
}
