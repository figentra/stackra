/**
 * Stackra file contract:
 * Purpose: `ownsAllowLists(root)`, whether a repository holds the CLI source that keeps the `ALLOWED` and `PENDING`
 *          duplicate-export lists: they are core's own, baked into the CLI, so they mean something only in the
 *          repository that contains their file. In any other repository (a product made with `stackra create`) every
 *          entry would read as stale and fail the check.
 * Boundary: reads one path under `root`.
 * Runtime: node
 * Governing contract: ADR 0305; stackra-224 (STA-1382).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/** The file the lists live in, relative to the repository root. */
const PENDING_FILE =
  "packages/developer/cli/src/node/duplicate-exports/constants/pending.constant.ts";

/**
 * True when `root` is the repository that keeps the allow-lists.
 *
 * @param root - the workspace root.
 * @example
 * ownsAllowLists(workspaceRoot(process.cwd())); // true in core, false in a product repository
 */
export function ownsAllowLists(root: string): boolean {
  return existsSync(join(root, PENDING_FILE));
}
