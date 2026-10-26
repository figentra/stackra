/**
 * Stackra file contract:
 * Purpose: `structureGroups(rows, adr)`, a frozen group table from compact rows; a row names its own ADR only when it differs
 *          from the table's.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 14).
 */
import type { StructureGroup } from "#node/types/structure-group.type";

/**
 * The group table of `rows`.
 *
 * @param rows - `[group, suffixes, reason, adr?]` each.
 * @param adr - the table's ADR, used where a row names none.
 * @example
 * structureGroups([["actions", ["action"], "write operations"]], "0294 d13");
 */
export function structureGroups(
  rows: readonly (readonly [string, readonly string[], string, string?])[],
  adr: string,
): readonly StructureGroup[] {
  return Object.freeze(
    rows.map(([group, suffixes, reason, rowAdr]) => ({
      group,
      suffixes,
      reason,
      adr: rowAdr ?? adr,
    })),
  );
}
