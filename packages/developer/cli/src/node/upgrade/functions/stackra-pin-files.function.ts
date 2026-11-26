/**
 * Stackra file contract:
 * Purpose: `stackraPinFiles(root)`, the files of a workspace that can pin `@stackra/*` versions: the root
 *          `pnpm-workspace.yaml` (its catalogs and overrides), the root package.json and every member's package.json,
 *          relative to the root, in that order.
 * Boundary: reads pnpm-workspace.yaml and the members' package.json files (`readManifestMembers`); writes nothing. A
 *           folder without pnpm-workspace.yaml is a single package: its package.json alone.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { readManifestMembers } from "#node/functions/read-workspace-members.function";

/**
 * The files that may hold a pin.
 *
 * @example
 * stackraPinFiles("/repo"); // ["pnpm-workspace.yaml", "package.json", "services/orders/package.json"]
 */
export function stackraPinFiles(root: string): readonly string[] {
  const files: string[] = [];
  const workspace = existsSync(join(root, "pnpm-workspace.yaml"));
  if (workspace) files.push("pnpm-workspace.yaml");
  if (existsSync(join(root, "package.json"))) files.push("package.json");
  if (workspace)
    for (const member of readManifestMembers(root))
      if (member.dir !== "" && member.dir !== ".") files.push(`${member.dir}/package.json`);
  return files;
}
