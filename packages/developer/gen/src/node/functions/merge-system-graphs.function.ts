/**
 * Stackra file contract:
 * Purpose: `mergeSystemGraphs`, the merge step: it reads the `stackra.graph.json` of each repo (os, commerce, each
 *          product, stackra) and writes one system graph through `systemGraph`, so calls and events across repos
 *          resolve and each node's `usedBy` and flow tags span the whole system.
 * Boundary: reads and writes files only; the derivation is `systemGraph`'s. The repo graphs are read as written; a
 *           repo whose graph is missing fails the run with the path, never a partial map.
 * Runtime: node
 * Governing contract: ADR 0452 (decision 2); STA-845.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { systemGraph } from "#core/functions/system-graph.function";
import type { SystemGraph } from "#core/types/system-graph.type";

/**
 * Writes the merged graph of `graphs` to `out` and returns it.
 *
 * @param graphs - the paths of the repos' `stackra.graph.json` files.
 * @param out - the path to write the system graph to.
 * @throws Error when a graph file is missing or not valid JSON.
 * @example
 * mergeSystemGraphs(["/work/os/stackra.graph.json", "/work/commerce/stackra.graph.json"], "/work/system.graph.json");
 */
export function mergeSystemGraphs(graphs: readonly string[], out: string): SystemGraph {
  const parts = graphs.map((path) => {
    if (!existsSync(path))
      throw new Error(`${path} is missing: run the repo graph step there first`);
    try {
      return JSON.parse(readFileSync(path, "utf8")) as SystemGraph;
    } catch (error) {
      throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, { cause: error });
    }
  });
  const graph = systemGraph(parts);
  writeFileSync(out, `${JSON.stringify(graph, null, 2)}\n`);
  return graph;
}
