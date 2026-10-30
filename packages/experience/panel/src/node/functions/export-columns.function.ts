/**
 * Stackra file contract:
 * Purpose: `exportColumns`, the columns a queued export writes: the requested row paths minus every `@Classified` one,
 *          unless that column opted in and the reader holds the opt-in permission.
 * Boundary: pure and internal. A path is classified when its first segment is a classified field of the row shape
 *           (`customer.email` is classified when `customer` is), and a classified column stays only when it is in
 *           `optedIn`, which the caller fills only after the L2 check passed. Every `DataClassification` is above
 *           Internal, so every classified field is dropped by default. A `credential` column is dropped even when
 *           opted in: no permission releases a provider secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 10: classified fields above Internal are excluded unless opted in under an L2 verb);
 *                     ADR 0134 (classification); ADR 0494 (credential).
 */
import { DataClassification } from "@stackra/contracts";

/**
 * The requested columns an export may write, in order, with the classes of those it keeps.
 *
 * @example
 * exportColumns(["number", "email"], Classified.members(OrderRow), new Set()); // { columns: ["number"], classes: [] }
 */
export function exportColumns(
  requested: readonly string[],
  classified: ReadonlyMap<string | symbol, DataClassification>,
  optedIn: ReadonlySet<string>,
): { readonly columns: string[]; readonly classes: DataClassification[] } {
  const columns: string[] = [];
  const classes = new Set<DataClassification>();
  for (const column of requested) {
    const classification = classified.get(column.split(".")[0] ?? column);
    // a Credential is never exported, even opted in (ADR 0494 rule 2)
    if (classification === DataClassification.Credential) continue;
    if (classification !== undefined && !optedIn.has(column)) continue;
    if (classification !== undefined) classes.add(classification);
    columns.push(column);
  }
  return { columns, classes: [...classes] };
}
