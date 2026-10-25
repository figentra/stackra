/**
 * Stackra file contract:
 * Purpose: `workspaceRoot(cwd)`, the nearest folder at or above `cwd` that holds `pnpm-workspace.yaml`, or `cwd`
 *          itself when there is none, so `stackra new` writes members where the workspace expects them from any
 *          folder inside it.
 * Boundary: reads folder existence only.
 * Runtime: node
 * Governing contract: the Workspace Layout rule; ADR 0282 (consequences: `new` moves into the CLI).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The workspace root around `cwd`.
 *
 * @param cwd - where the search starts.
 * @example
 * workspaceRoot("/repo/packages/data/storage"); // "/repo"
 */
export function workspaceRoot(cwd: string): string {
  for (let folder = cwd; ; folder = dirname(folder)) {
    if (existsSync(join(folder, "pnpm-workspace.yaml"))) return folder;
    if (dirname(folder) === folder) return cwd;
  }
}
