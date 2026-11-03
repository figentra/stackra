/**
 * Stackra file contract:
 * Purpose: `importsMapFindings(root)`, the imports-map drift check of `stackra validate --repository` (STA-2072): every
 *          workspace member but a `config`-tier preset must carry, as its `package.json` `imports`, the map
 *          `importsMap(dir)` derives from its folders (ADR 0233 decision 1). Key order does not count; target order
 *          does, since resolvers try targets in order. A member with no `imports` is compared as an empty map.
 * Boundary: reads pnpm-workspace.yaml, each member's package.json and folder names; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0233 (decisions 1 and 6); ADR 0006 (rule 5).
 */
import { isDeepStrictEqual } from "node:util";
import { join } from "node:path";

import { importsMap } from "#node/functions/imports-map.function";
import { readManifestMembers } from "#node/functions/read-workspace-members.function";
import { sorted } from "#node/functions/sorted.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * One finding per checked member whose `imports` map is not the generated one, naming the aliases to add, remove and
 * retarget.
 *
 * @param root - the folder holding pnpm-workspace.yaml.
 * @example
 * importsMapFindings(root); // [{ dir: "packages/data/cache", text: 'package.json "imports" is not ...: add #react/*' }]
 */
export function importsMapFindings(root: string): DirFinding[] {
  const findings: DirFinding[] = [];
  for (const { dir, manifest } of readManifestMembers(root)) {
    if (manifest.stackra?.tier === "config") continue;
    const have = ((manifest as { readonly imports?: unknown }).imports ?? {}) as Record<
      string,
      unknown
    >;
    const want = importsMap(join(root, dir));
    const add = Object.keys(want).filter((key) => !(key in have));
    const remove = Object.keys(have).filter((key) => !(key in want));
    const retarget = Object.keys(want).filter(
      (key) => key in have && !isDeepStrictEqual(have[key], want[key]),
    );
    const changes = [
      ...sorted(add).map((key) => `add ${key}`),
      ...sorted(remove).map((key) => `remove ${key}`),
      ...sorted(retarget).map((key) => `retarget ${key}`),
    ];
    if (changes.length > 0)
      findings.push({
        dir,
        text: `package.json "imports" is not the generated map (ADR 0233 decision 1): ${changes.join("; ")}`,
      });
  }
  return findings;
}
