/**
 * Stackra file contract:
 * Purpose: `listedOptionIdsOf(options, chosen)`, the chosen ids of a multi-select filter in the order its options are
 *          listed, not the order they were ticked, so the filter's value is stable.
 * Boundary: pure; ids that are not options are dropped. The web and native FilterEditor both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3 and 4).
 */
import type { SelectItem } from "#contracts/types/select-item.type";

/**
 * The chosen ids, in the options' order.
 * @example listedOptionIdsOf([{ id: "a", label: "A" }, { id: "b", label: "B" }], ["b", "a"]); // ["a", "b"]
 */
export function listedOptionIdsOf(
  options: readonly SelectItem[],
  chosen: readonly string[],
): string[] {
  return options.map((option) => option.id).filter((id) => chosen.includes(id));
}
