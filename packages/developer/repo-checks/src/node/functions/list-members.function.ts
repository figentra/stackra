/**
 * Stackra file contract:
 * Purpose: `listMembers(root)`, the pnpm workspace members at `root` from `pnpm -r list --json --depth -1`, the root
 *          package included.
 * Boundary: runs pnpm once.
 * Runtime: node
 * Governing contract: the Workspace Layout rule; ADR 0010.
 */
import { execFileSync } from "node:child_process";
import { relative } from "node:path";

import type { WorkspaceMember } from "#node/types/workspace-member.type";

/**
 * The members of the workspace at `root`.
 *
 * @param root - the absolute workspace root.
 * @throws Error when pnpm cannot list the workspace.
 * @example
 * listMembers("/repo").map((m) => m.dir); // ["", "apps/docs", …]
 */
export function listMembers(root: string): WorkspaceMember[] {
  const listed = JSON.parse(
    execFileSync("pnpm", ["-r", "list", "--json", "--depth", "-1"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  ) as { readonly name?: string; readonly path: string }[];
  return listed.map(({ name, path }) => ({ name, dir: relative(root, path), path }));
}
