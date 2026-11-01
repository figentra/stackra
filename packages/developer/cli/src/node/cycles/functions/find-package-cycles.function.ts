/**
 * Stackra file contract:
 * Purpose: `findPackageCycles(graph)`, every elementary cycle a depth-first walk of the package graph meets, each as a
 *          path that starts at its smallest name and repeats it at the end (`["a", "b", "a"]`), deduplicated and
 *          sorted (moved from `tools/scripts/package-cycles.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0003 (tier dependency direction); STA-1373.
 */
import { sorted } from "#node/functions/sorted.function";

/**
 * The cycles of `graph`.
 * shortcut: one cycle per back edge, not every elementary cycle of a large strongly connected component; enough to
 * name and break them one at a time.
 *
 * @param graph - each name to the names it depends on.
 * @example
 * findPackageCycles(new Map([["m", ["m"]]])); // [["m", "m"]]
 */
export function findPackageCycles(
  graph: ReadonlyMap<string, readonly string[]>,
): readonly string[][] {
  const state = new Map<string, "open" | "done">();
  const stack: string[] = [];
  const found = new Map<string, string[]>();
  const visit = (name: string): void => {
    state.set(name, "open");
    stack.push(name);
    for (const next of graph.get(name) ?? []) {
      if (state.get(next) === "open") {
        const loop = stack.slice(stack.indexOf(next));
        const start = loop.indexOf(sorted(loop)[0] ?? "");
        const path = [...loop.slice(start), ...loop.slice(0, start)];
        found.set(path.join("\u0000"), [...path, path[0] ?? ""]);
      } else if (!state.has(next)) visit(next);
    }
    stack.pop();
    state.set(name, "done");
  };
  for (const name of sorted(graph.keys())) if (!state.has(name)) visit(name);
  return sorted(found.keys()).map((key) => found.get(key) ?? []);
}
