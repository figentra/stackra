/**
 * Stackra file contract:
 * Purpose: `groupSelectItems`, the sections a Select draws from its flat `items`: the choices that share a `section`
 *          form one group under that header, in the order each section first appears, and a run of choices with no
 *          section forms a group with no header where it stands. Both runtimes draw the same groups from the same data.
 * Boundary: pure; keeps the order of the choices inside each group, so a list without any `section` comes back as one
 *           group in its own order.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); owner approval 2026-10-29 (STA-1371, Select
 *          sections).
 */
import type { SelectItem } from "#contracts/types/select-item.type";

/** The groups of `items`: each section's choices together under its name, in first-appearance order. */
export function groupSelectItems(
  items: readonly SelectItem[],
): readonly { readonly section: string | undefined; readonly items: readonly SelectItem[] }[] {
  const groups: { section: string | undefined; items: SelectItem[] }[] = [];
  const named = new Map<string, SelectItem[]>();
  let loose: SelectItem[] | undefined;
  for (const item of items) {
    if (item.section === undefined) {
      // A choice with no section joins the loose run before it, unless a named group came in between.
      if (loose === undefined || groups.at(-1)?.items !== loose) {
        loose = [];
        groups.push({ section: undefined, items: loose });
      }
      loose.push(item);
      continue;
    }
    let group = named.get(item.section);
    if (group === undefined) {
      group = [];
      named.set(item.section, group);
      groups.push({ section: item.section, items: group });
    }
    group.push(item);
  }
  return groups;
}
