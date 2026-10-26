/**
 * Stackra file contract:
 * Purpose: `readRepoContext(root)`, the repository a check runs over: the root and every file git lists (tracked plus
 *          untracked, not ignored) that exists on disk; when git cannot list them (no repository, or a worktree whose
 *          `.git` points elsewhere), the files a walk honouring `.gitignore` finds (`walkRepoFiles`).
 * Boundary: runs `git ls-files` once, else walks the tree; never throws for a missing or broken git.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { walkRepoFiles } from "#node/functions/walk-repo-files.function";
import type { RepoContext } from "#node/types/repo-context.type";

/**
 * The context of the repository at `root`.
 *
 * @param root - the absolute repository root.
 * @example
 * readRepoContext("/repo").files; // ["AGENTS.md", "apps/docs/package.json", …]
 */
export function readRepoContext(root: string): RepoContext {
  let listed: string[];
  try {
    listed = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate"],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).split("\n");
  } catch {
    return { root, files: walkRepoFiles(root) };
  }
  return { root, files: listed.filter((path) => path && existsSync(join(root, path))) };
}
