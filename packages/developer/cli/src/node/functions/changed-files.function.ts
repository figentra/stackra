/**
 * Stackra file contract:
 * Purpose: `changedFiles(root, base)`, the files `stackra check --affected` checks: changed since the merge base with
 *          `base`, plus staged, unstaged and untracked (not ignored) files, that still exist.
 * Boundary: runs git; an unknown base throws with git's message.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The repository-relative files changed since `base`, sorted and unique.
 *
 * @param root - the absolute repository root.
 * @param base - the ref to compare with, for example `origin/main`.
 * @throws Error when git cannot resolve `base`.
 * @example
 * changedFiles("/repo", "origin/main"); // ["packages/data/storage/src/core/a.ts", …]
 */
export function changedFiles(root: string, base: string): string[] {
  const git = (...args: string[]): string[] =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\n")
      .filter(Boolean);
  const files = [
    ...git("diff", "--name-only", `${base}...HEAD`),
    ...git("diff", "--name-only", "HEAD"),
    ...git("ls-files", "--others", "--exclude-standard"),
  ];
  return [...new Set(files)].filter((path) => existsSync(join(root, path))).sort();
}
