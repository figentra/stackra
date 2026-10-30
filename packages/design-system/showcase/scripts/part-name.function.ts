/**
 * Stackra file contract:
 * Purpose: `partName`, the compound part name of a sibling props type ("CardTitleProps" under "Card" -> "Card.Title").
 * Boundary: a pure function.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** "CardTitle" under main part "Card" -> "Card.Title"; an unrelated name stays as it is. */
export function partName(typeName: string, main: string): string {
  const bare = typeName.replace(/Props$/, "");
  return bare !== main && bare.startsWith(main) && /^[A-Z]/.test(bare.slice(main.length))
    ? `${main}.${bare.slice(main.length)}`
    : bare;
}
