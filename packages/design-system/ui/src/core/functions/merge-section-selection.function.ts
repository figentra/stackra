/**
 * Stackra file contract:
 * Purpose: the menu's chosen keys after one section changed its own: the keys of the other sections are kept and the
 *          section's are replaced, so a menu with one choice for sorting and several for columns holds one flat list.
 * Boundary: pure; internal, not in the `.` barrel (the web and native `Menu` import it by path).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312.
 */

/**
 * Replaces one section's share of a selection.
 * @param selected - every chosen key of the menu, across sections
 * @param sectionKeys - the keys of the section that changed (all of them, chosen or not)
 * @param next - the keys now chosen in that section
 * @returns the other sections' chosen keys, in their order, then the section's new ones
 */
export function mergeSectionSelection(
  selected: readonly string[],
  sectionKeys: readonly string[],
  next: Iterable<string>,
): readonly string[] {
  const own = new Set(sectionKeys);
  return [...selected.filter((key) => !own.has(key)), ...next];
}
