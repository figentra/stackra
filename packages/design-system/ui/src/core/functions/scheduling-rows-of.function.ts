/**
 * Stackra file contract:
 * Purpose: `schedulingRowsOf(resources, collapsed)`, the rows of a SchedulingBoard in order: ungrouped resources
 *          first, then each group's heading followed by its resources unless it is collapsed; every resource is
 *          followed by its children, indented one deeper, and a child goes with its parent whatever its own group.
 * Boundary: pure. Groups keep the order of their first resource; a parent id naming no resource, or a parent chain
 *           that loops, is treated as no parent.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import type { SchedulingRow } from "#core/types/scheduling-row.type";

/**
 * The rows in order.
 * @param resources - the resources, in the caller's order
 * @param collapsed - the groups whose resources are hidden
 * @returns the headings and resources to draw
 * @example
 * schedulingRowsOf([{ id: "pitch", label: "Pitch" }, { id: "half", label: "Half", parentId: "pitch" }], new Set());
 * // pitch at depth 0, then half at depth 1
 */
export function schedulingRowsOf(
  resources: readonly SchedulingBoardResource[],
  collapsed: ReadonlySet<string>,
): SchedulingRow[] {
  const parents = parentsOf(resources);
  const children = new Map<string, SchedulingBoardResource[]>();
  for (const resource of resources) {
    const parent = parents.get(resource.id);
    if (parent !== undefined) children.set(parent, [...(children.get(parent) ?? []), resource]);
  }
  const rows: SchedulingRow[] = [];
  const walk = (resource: SchedulingBoardResource, ancestors: readonly string[]) => {
    rows.push({ kind: "resource", resource, depth: ancestors.length, ancestors });
    for (const child of children.get(resource.id) ?? []) walk(child, [resource.id, ...ancestors]);
  };
  const tops = resources.filter((resource) => parents.get(resource.id) === undefined);
  const groups: (string | undefined)[] = [];
  for (const top of tops) if (!groups.includes(top.group)) groups.push(top.group);
  // ungrouped first; a sort cannot do it, since it moves undefined to the end without asking the comparator
  const ordered = [
    ...groups.filter((group) => group === undefined),
    ...groups.filter((group) => group !== undefined),
  ];
  for (const group of ordered) {
    if (group !== undefined) rows.push({ kind: "group", group, collapsed: collapsed.has(group) });
    if (group !== undefined && collapsed.has(group)) continue;
    for (const top of tops) if (top.group === group) walk(top, []);
  }
  return rows;
}

/** Each resource's parent id, left out when it names no resource or its chain loops back. */
function parentsOf(resources: readonly SchedulingBoardResource[]): Map<string, string> {
  const byId = new Map(resources.map((resource) => [resource.id, resource]));
  const parents = new Map<string, string>();
  for (const resource of resources) {
    const parent = resource.parentId;
    if (parent === undefined || !byId.has(parent)) continue;
    const met = new Set([resource.id]);
    let at: string | undefined = parent;
    while (at !== undefined && !met.has(at)) {
      met.add(at);
      const next: string | undefined = byId.get(at)?.parentId;
      at = next !== undefined && byId.has(next) ? next : undefined;
    }
    if (at === undefined) parents.set(resource.id, parent);
  }
  return parents;
}
