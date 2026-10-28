/**
 * Stackra file contract:
 * Purpose: `workspaceMembers(root)`, the member roots of the pnpm workspace at `root`: every folder holding a
 *          package.json that the `packages` globs of `pnpm-workspace.yaml` match, minus the `!` globs, sorted by path.
 *          `stackra gen` and `stackra ls` at the workspace root walk these.
 * Boundary: reads `pnpm-workspace.yaml` and the folder tree; never `node_modules`.
 * Runtime: node
 * Governing contract: ADR 0010 (services are independent workspace members); the Workspace Layout rule.
 */
import { globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { parse } from "yaml";

/**
 * The absolute member roots of the workspace at `root`.
 *
 * @param root - the folder holding `pnpm-workspace.yaml`.
 * @throws Error when `pnpm-workspace.yaml` is missing or its `packages` is not a list of strings.
 * @example
 * workspaceMembers("/repo"); // ["/repo/apps/web", "/repo/packages/commerce/loyalty-kit", …]
 */
export function workspaceMembers(root: string): readonly string[] {
  const document = parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")) as {
    packages?: unknown;
  } | null;
  const globs = document?.packages;
  if (!Array.isArray(globs) || !globs.every((glob) => typeof glob === "string")) {
    throw new Error(`${join(root, "pnpm-workspace.yaml")} has no packages list`);
  }
  const include = globs
    .filter((glob) => !glob.startsWith("!"))
    .map((glob) => `${glob}/package.json`);
  const exclude = [
    "**/node_modules/**",
    ...globs.filter((glob) => glob.startsWith("!")).map((glob) => `${glob.slice(1)}/package.json`),
  ];
  const files = globSync(include, { cwd: root, exclude });
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...new Set(files.map((file) => join(root, dirname(file))))].sort();
}
