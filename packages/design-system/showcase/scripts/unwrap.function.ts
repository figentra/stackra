/**
 * Stackra file contract:
 * Purpose: `unwrap`, drop the parentheses TS keeps around a function type once `| undefined` is removed.
 * Boundary: a pure function.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** "(() => void)" -> "() => void"; anything else unchanged. */
export function unwrap(type: string): string {
  if (!type.startsWith("(")) return type;
  let depth = 0;
  for (let index = 0; index < type.length; index += 1) {
    if (type[index] === "(") depth += 1;
    else if (type[index] === ")") depth -= 1;
    if (depth === 0) return index === type.length - 1 ? type.slice(1, -1) : type;
  }
  return type;
}
