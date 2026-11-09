/**
 * Stackra file contract:
 * Purpose: `declarationReason`, the reason a row-security declaration of a migration gives (`t.platformTable`,
 *          `t.reviewedPolicy`, `t.systemAccess`, `schema.systemFunction`), trimmed: required and one line, since the
 *          compiled migration carries it on its `-- stackra:` marker line.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, group (c) table and gap A).
 */

/**
 * The trimmed reason of the declaration `call`.
 *
 * @param call - the declaration as written, for the message (`t.platformTable`).
 * @throws TypeError for a reason that is empty or not one line.
 * @example
 * declarationReason("t.platformTable", "  one row per consumer class "); // "one row per consumer class"
 */
export function declarationReason(call: string, reason: unknown): string {
  const text = typeof reason === "string" ? reason.trim() : "";
  if (text === "") throw new TypeError(`${call} needs its reason, a non-empty sentence`);
  if (/[\r\n]/.test(text)) throw new TypeError(`${call}: the reason is one line`);
  return text;
}
