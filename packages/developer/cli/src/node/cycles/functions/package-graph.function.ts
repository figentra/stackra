/**
 * Stackra file contract:
 * Purpose: `packageGraph(members)`, the workspace package graph: each member name to the sorted workspace member names
 *          it depends on through dependencies, devDependencies, peerDependencies or optionalDependencies, whatever the
 *          specifier (moved from `tools/scripts/package-cycles.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0003 (tier dependency direction); STA-1373.
 */
import { DEPENDENCY_FIELDS } from "@stackra/repo-checks/node";

import { sorted } from "#node/functions/sorted.function";
import type { ManifestMember } from "#node/types/manifest-member.type";

/**
 * The graph of `members`, keyed in name order.
 *
 * @param members - the workspace members, as `readManifestMembers` reads them.
 * @example
 * packageGraph(readManifestMembers(root)).get("@stackra/a"); // ["@stackra/b"]
 */
export function packageGraph(
  members: readonly Pick<ManifestMember, "name" | "manifest">[],
): Map<string, string[]> {
  const names = new Set(members.map((member) => member.name));
  const graph = new Map<string, string[]>();
  for (const { name, manifest } of sorted(members, (a, b) => (a.name < b.name ? -1 : 1))) {
    const targets = new Set(
      DEPENDENCY_FIELDS.flatMap((field) => Object.keys(manifest[field] ?? {})).filter((dep) =>
        names.has(dep),
      ),
    );
    graph.set(name, sorted(targets));
  }
  return graph;
}
