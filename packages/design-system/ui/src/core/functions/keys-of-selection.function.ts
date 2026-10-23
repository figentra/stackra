/**
 * Stackra file contract:
 * Purpose: a React Aria or HeroUI Native selection as the list of item ids the contract reports: the `"all"` that a
 *          select-all control produces becomes every id, and a `Set` of keys becomes strings in the items' order.
 * Boundary: pure; internal, not in the `.` barrel (the Table, List, Tabs and Accordion wrappers import it by path).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313.
 */

/**
 * Turns a selection into a list of ids.
 * @param selection - `"all"`, or the keys React Aria or HeroUI Native selected
 * @param allKeys - the id of every item the collection holds, in order
 * @returns `allKeys` for `"all"`, otherwise the selected keys as strings in `allKeys` order, with any key the
 *          collection no longer holds kept last
 */
export function keysOfSelection(
  selection: "all" | Iterable<unknown>,
  allKeys: readonly string[],
): readonly string[] {
  if (selection === "all") return allKeys;
  const chosen = new Set([...selection].map(String));
  // The order of the items, not the order of the presses, so a controlled value does not reshuffle.
  const known = new Set(allKeys);
  return [
    ...allKeys.filter((key) => chosen.has(key)),
    ...[...chosen].filter((key) => !known.has(key)),
  ];
}
