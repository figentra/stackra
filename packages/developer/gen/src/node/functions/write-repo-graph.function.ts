/**
 * Stackra file contract:
 * Purpose: `writeRepoGraph`, the repo step of the system graph: it finds every member's `.stackra/graph.json` under
 *          the repo root (written by each member's gen run), stamps each with the repo key, its id
 *          (`<repo>.<member>`) and its folder, reads the flows the repo declares once in `stackra.flows.json`, and
 *          writes the repo's `stackra.graph.json` at the root through `systemGraph`.
 * Boundary: reads and writes files only; the derivation is `systemGraph`'s. It never runs gen: a member whose gen
 *           has not run has no graph file and is left out. `node_modules`, `dist` and dot folders other than
 *           `.stackra` are not walked. A graph or flow file that is not valid JSON, or a flow file without a
 *           `flows` array of `{ id, title, steps }`, fails the run with the path.
 * Runtime: node
 * Governing contract: ADR 0452 (decisions 1 to 3); STA-845.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { systemGraph } from "#core/functions/system-graph.function";
import type { GraphFlow } from "#core/types/graph-flow.type";
import type { GraphNode } from "#core/types/graph-node.type";
import type { MemberGraph } from "#core/types/member-graph.type";
import type { SystemGraph } from "#core/types/system-graph.type";

/** The folders the walk never enters. */
const SKIPPED = new Set(["node_modules", "dist", "coverage"]);

/** Every member folder under `dir` holding `.stackra/graph.json`, sorted. */
function memberFolders(dir: string): string[] {
  const found: string[] = [];
  if (existsSync(join(dir, ".stackra", "graph.json"))) found.push(dir);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((left, right) =>
    left.name < right.name ? -1 : 1,
  ))
    if (entry.isDirectory() && !entry.name.startsWith(".") && !SKIPPED.has(entry.name))
      found.push(...memberFolders(join(dir, entry.name)));
  return found;
}

/** `path` parsed as JSON, or an error naming the path. */
function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, { cause: error });
  }
}

/** The flows of the repo's `stackra.flows.json`, or none when it has none. */
function readFlows(root: string): GraphFlow[] {
  const path = join(root, "stackra.flows.json");
  if (!existsSync(path)) return [];
  const flows = (readJson(path) as { flows?: unknown }).flows;
  const valid =
    Array.isArray(flows) &&
    flows.every(
      (flow: Record<string, unknown> | null) =>
        typeof flow === "object" &&
        flow !== null &&
        typeof flow["id"] === "string" &&
        typeof flow["title"] === "string" &&
        Array.isArray(flow["steps"]),
    );
  if (!valid)
    throw new Error(
      `${path} must hold { "flows": [{ "id", "title", "steps": [...] }] } (ADR 0452 decision 3)`,
    );
  return flows as GraphFlow[];
}

/**
 * Writes `<root>/stackra.graph.json` and returns the graph.
 *
 * @param root - the repo root.
 * @param repo - the repo key, the graph's layer (`os`, `commerce`, `stackra`, `mezzora`).
 * @throws Error when a graph or flow file is not valid.
 * @example
 * writeRepoGraph("/work/os", "os").nodes.map((node) => node.id); // ["os.billing", "os.identity", ...]
 */
export function writeRepoGraph(root: string, repo: string): SystemGraph {
  const nodes: GraphNode[] = memberFolders(root).map((folder) => {
    const member = readJson(join(folder, ".stackra", "graph.json")) as MemberGraph;
    return {
      ...member,
      id: `${repo}.${member.member}`,
      repo,
      path: relative(root, folder).split(sep).join("/"),
      usedBy: [],
      flows: [],
    };
  });
  const graph = systemGraph([{ nodes, flows: readFlows(root) }]);
  writeFileSync(join(root, "stackra.graph.json"), `${JSON.stringify(graph, null, 2)}\n`);
  return graph;
}
