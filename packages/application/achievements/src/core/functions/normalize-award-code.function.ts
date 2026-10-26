/**
 * Stackra file contract:
 * Purpose: `normalizeAwardCode`, a short verify code as a person typed it, reduced to its 12 canonical characters:
 *          case folded, spaces and hyphens dropped, and the Crockford look-alikes read as digits (O as 0, I and L as 1).
 * Boundary: pure. Anything that is not 12 code characters afterwards is `null`, never a guess.
 * Runtime: isomorphic
 * Governing contract: ADR 0432 (decision 2).
 */
import { AWARD_CODE_ALPHABET } from "#core/constants/award-code-alphabet.constant";

/**
 * The canonical form of `typed`, or null when it is not a code.
 *
 * @example
 * normalizeAwardCode("7k3q-9xpm-0abz"); // "7K3Q9XPM0ABZ"
 * normalizeAwardCode("7K3Q 9XPM OABZ"); // "7K3Q9XPM0ABZ"
 */
export function normalizeAwardCode(typed: string): string | null {
  const code = typed.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  if (code.length !== 12) return null;
  return [...code].every((character) => AWARD_CODE_ALPHABET.includes(character)) ? code : null;
}
