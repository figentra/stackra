/**
 * Stackra file contract:
 * Purpose: `readRepoContext(root)`, the repository a check runs over: the root and every file git lists (tracked plus
 *          untracked, not ignored) that exists on disk.
 * Boundary: runs `git ls-files` once; a root outside a git repository throws.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { RepoContext } from "#node/types/repo-context.type";

/**
 * The context of the repository at `root`.
 *
 * @param root - the absolute repository root.
 * @throws Error when git cannot list the files.
 * @example
 * readRepoContext("/repo").files; // ["AGENTS.md", "apps/docs/package.json", …]
 */
export function readRepoContext(root: string): RepoContext {
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate"],
    { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  )
    .split("\n")
    .filter((path) => path && existsSync(join(root, path)));
  return { root, files };
}
