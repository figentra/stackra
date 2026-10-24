/**
 * Stackra file contract:
 * Purpose: `kindNames`, the kind-number-to-name table of a backend's `SyntaxKind`, first name winning, because
 *          `SyntaxKind[n]` returns marker aliases (`FirstLiteralToken` for `NumericLiteral`) in TypeScript 6 and 7.
 * Boundary: pure; shared by both hosts so their names agree.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26); the STA-335 type-to-schema spike (marker names gotcha).
 */

/**
 * Kind number to name, first declared name wins.
 *
 * @param syntaxKind - the backend's `SyntaxKind` enum object.
 * @example
 * kindNames({ NumericLiteral: 9, FirstLiteralToken: 9 })[9]; // "NumericLiteral"
 */
export function kindNames(
  syntaxKind: Readonly<Record<string, string | number>>,
): ReadonlyMap<number, string> {
  const names = new Map<number, string>();
  for (const [name, value] of Object.entries(syntaxKind))
    if (typeof value === "number" && !names.has(value)) names.set(value, name);
  return names;
}
