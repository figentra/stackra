/**
 * Stackra file contract:
 * Purpose: `writeSystemMap`, the step that regenerates the system map pages: it reads the merged system graph
 *          (`mergeSystemGraphs`' output, or one repo's `stackra.graph.json`), renders it with `renderSystemMap` and
 *          writes `index.mdx`, `flows/` and `services/` into the map folder, replacing the previous generated pages
 *          whole so a removed flow or service leaves no stale page. Run as
 *          `node apps/docs/src/system-map/write-system-map.ts <graph.json> [out-dir]` (Node strips the types; the
 *          renderer is imported as `#src/system-map/render-system-map`, which `imports` in package.json maps to its
 *          `.ts` file, so Node finds it without a written extension).
 * Boundary: reads one file and writes generated pages only; the rendering is `renderSystemMap`'s. It never touches
 *           anything but `index.mdx`, `flows/` and `services/` under the out folder (the renderer's own source and
 *           tests stay). A missing graph, invalid JSON or an unknown graph version fails the run with the path.
 * Runtime: node
 * Governing contract: ADR 0452 (decision 4: one graph shape, read by the renderer); STA-845; batch stackra-60
 *                     (STA-1098).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { SystemGraph } from "@stackra/gen";

import { renderSystemMap } from "#src/system-map/render-system-map";

/**
 * Regenerates the map pages from the graph at `graphPath` into `outDir` and returns the written page paths.
 *
 * @param graphPath - the merged system graph JSON.
 * @param outDir - the map folder; defaults to this file's folder (`apps/docs/src/system-map`).
 * @throws Error when the graph is missing, not valid JSON or not a version 1 graph.
 * @example
 * writeSystemMap("/work/system.graph.json"); // ["flows/checkout.mdx", "index.mdx", "services/os/billing.mdx"]
 */
export function writeSystemMap(
  graphPath: string,
  outDir: string = dirname(fileURLToPath(import.meta.url)),
): string[] {
  if (!existsSync(graphPath))
    throw new Error(`${graphPath} is missing: run the merge step (mergeSystemGraphs) first`);
  let graph: SystemGraph;
  try {
    graph = JSON.parse(readFileSync(graphPath, "utf8")) as SystemGraph;
  } catch (error) {
    throw new Error(`${graphPath} is not valid JSON: ${(error as Error).message}`, {
      cause: error,
    });
  }
  if (graph?.version !== 1)
    throw new Error(`${graphPath} is not a version 1 system graph (ADR 0452)`);

  const pages = renderSystemMap(graph);
  rmSync(join(outDir, "flows"), { recursive: true, force: true });
  rmSync(join(outDir, "services"), { recursive: true, force: true });
  for (const page of pages) {
    const target = join(outDir, page.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${page.content.trimEnd()}\n`);
  }
  return pages.map((page) => page.path);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [graphPath, outDir] = process.argv.slice(2);
  if (graphPath === undefined) {
    process.stderr.write("usage: node write-system-map.ts <graph.json> [out-dir]\n");
    process.exitCode = 1;
  } else
    for (const path of writeSystemMap(graphPath, outDir ?? undefined))
      process.stdout.write(`${path}\n`);
}
