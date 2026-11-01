/**
 * Stackra file contract:
 * Purpose: `readArchitectureInputs(root)`, the architecture map's inputs: each member's place (the `stackra` field
 *          first, the turbo.jsonc tags where it is silent; runtimes are the union of both) and the client call edges of
 *          the repo's `stackra.graph.json` (gen's system graph, ADR 0452) (moved from
 *          `tools/scripts/architecture-map.mjs`).
 * Boundary: reads the workspace manifests, each member's turbo.jsonc and stackra.graph.json; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0452 (system graph); STA-1373.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { stripJsonc } from "@stackra/repo-checks/node";

import type { ArchitectureInputs } from "#node/architecture-map/types/architecture-inputs.type";
import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import { sorted } from "#node/functions/sorted.function";

const byText = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);

/** The turbo.jsonc tags of a member folder, or none. */
function tagsOf(root: string, dir: string): string[] {
  const path = join(root, dir, "turbo.jsonc");
  if (!existsSync(path)) return [];
  return (JSON.parse(stripJsonc(readFileSync(path, "utf8"))) as { tags?: string[] }).tags ?? [];
}

/** The value of a `<key>:` tag, every one of them. */
const tagValues = (tags: readonly string[], key: string): string[] =>
  tags.filter((tag) => tag.startsWith(`${key}:`)).map((tag) => tag.slice(key.length + 1));

/**
 * What the map is drawn from.
 *
 * @param root - the workspace root.
 * @example
 * readArchitectureInputs(root); // { members: [{ dir, name, tier, category, runtimes }], calls: [{ from, to }] }
 */
export function readArchitectureInputs(root: string): ArchitectureInputs {
  const members = readManifestMembers(root).map(({ dir, name, manifest }) => {
    const tags = tagsOf(root, dir);
    const stackra = manifest.stackra ?? {};
    return {
      dir,
      name,
      tier: stackra.tier ?? tagValues(tags, "tier")[0] ?? "untiered",
      category: stackra.category ?? tagValues(tags, "category")[0],
      runtimes: sorted(
        new Set([...(stackra.runtimes ?? []), ...tagValues(tags, "runtime")]),
        byText,
      ),
    };
  });
  const graphPath = join(root, "stackra.graph.json");
  const calls: { from: string | undefined; to: string | undefined }[] = [];
  if (existsSync(graphPath)) {
    const graph = JSON.parse(readFileSync(graphPath, "utf8")) as {
      nodes?: { id: string; package: string }[];
      edges?: { from: string; to: string; kind: string }[];
    };
    const packageOf = new Map((graph.nodes ?? []).map((node) => [node.id, node.package]));
    for (const edge of graph.edges ?? [])
      if (edge.kind === "call")
        calls.push({ from: packageOf.get(edge.from), to: packageOf.get(edge.to) });
  }
  return { members, calls };
}
