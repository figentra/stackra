/**
 * Stackra file contract:
 * Purpose: `fitTabs(ids, widths, selected, available, reserved)`, the ids of the tabs that fit a row of `available`
 *          pixels, in their order: all of them when they fit beside `reserved` (the list's padding and gaps), else
 *          the selected tab first and then the others in order while they fit beside the "More" button too.
 * Boundary: pure; a tab with no measured width counts as zero wide, and the selected tab is kept even when it alone is
 *           too wide, so the row is never empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C, Tabs overflow).
 */

/** The ids that stay in the row. */
export function fitTabs(
  ids: readonly string[],
  widths: ReadonlyMap<string, number>,
  selected: string | undefined,
  available: number,
  reserved: { readonly chrome: number; readonly more: number },
): readonly string[] {
  const width = (id: string) => widths.get(id) ?? 0;
  const total = ids.reduce((sum, id) => sum + width(id), reserved.chrome);
  if (total <= available) return ids;
  // The "More" button sits beside the row with an 8px gap.
  let used = reserved.chrome + reserved.more + 8 + (selected === undefined ? 0 : width(selected));
  const kept = new Set(selected === undefined ? [] : [selected]);
  for (const id of ids) {
    if (kept.has(id)) continue;
    if (used + width(id) > available) break;
    used += width(id);
    kept.add(id);
  }
  return ids.filter((id) => kept.has(id));
}
