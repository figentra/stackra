/**
 * Stackra file contract:
 * Purpose: `listUpgradeServices(root)`, the service members of a workspace (`services/*`, `tier:service`), relative to
 *          the root: where a codemod step `in: "services"` runs.
 * Boundary: reads pnpm-workspace.yaml and the members' package.json files; writes nothing. A folder without
 *           pnpm-workspace.yaml has none.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0091; STA-145.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { tierFor } from "@stackra/repo-checks/node";

import { readManifestMembers } from "#node/functions/read-workspace-members.function";

/**
 * The service folders.
 *
 * @example
 * listUpgradeServices("/repo"); // ["services/orders"]
 */
export function listUpgradeServices(root: string): readonly string[] {
  if (!existsSync(join(root, "pnpm-workspace.yaml"))) return [];
  return readManifestMembers(root)
    .filter((member) => tierFor(member.dir) === "tier:service")
    .map((member) => member.dir);
}
