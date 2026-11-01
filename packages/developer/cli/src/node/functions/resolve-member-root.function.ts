/**
 * Stackra file contract:
 * Purpose: `resolveMemberRoot(cwd, member)`, the folder of the member a `stackra console <member>` names: a path from
 *          the working directory that holds a package.json, or, at a workspace root, the one workspace member whose
 *          folder name, package name or path from the root equals `member`.
 * Boundary: reads package.json files only. Fails with the candidates when two members share a folder name, and with a
 *           usage error when none matches.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); STA-1731 spec FR-009.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { workspaceMembers } from "#node/functions/workspace-members.function";

/** The package name of the member at `root`, or undefined. */
function nameOf(root: string): string | undefined {
  try {
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      name?: unknown;
    };
    return typeof manifest.name === "string" ? manifest.name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The root of the member `member` names.
 *
 * @param cwd - the working directory.
 * @param member - a path, a folder name (`example`), a package name or a path from the workspace root.
 * @throws CliUsageError when no member matches, or several do.
 * @example
 * resolveMemberRoot("/repo", "example"); // "/repo/services/example"
 */
export function resolveMemberRoot(cwd: string, member: string): string {
  const direct = resolve(cwd, member);
  if (existsSync(join(direct, "package.json"))) return direct;
  const found = existsSync(join(cwd, "pnpm-workspace.yaml"))
    ? workspaceMembers(cwd).filter(
        (root) =>
          basename(root) === member || nameOf(root) === member || relative(cwd, root) === member,
      )
    : [];
  if (found.length === 1) return found[0] ?? direct;
  if (found.length > 1)
    throw new CliUsageError(
      `${member} names more than one member (${found.map((root) => relative(cwd, root)).join(", ")}); give its path`,
    );
  throw new CliUsageError(`no member named ${member} (give its folder, package name or path)`);
}
