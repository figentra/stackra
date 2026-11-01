/**
 * Stackra file contract:
 * Purpose: `specCheckForeignStatus(context)`, the rule that a PR may move another spec's `**Status**` only when one of
 *          its commits' `Refs:` names that spec's key, so a stage never changes as a side effect of unrelated work.
 * Boundary: pure. The PR's own spec and a newly added spec are exempt.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specFolderOf } from "./spec-folder-of.function.ts";
import { specIsOwn } from "./spec-is-own.function.ts";
import { specRefsKeys } from "./spec-refs-keys.function.ts";
import { specStatusLine } from "./spec-status-line.function.ts";

/**
 * Problems for one changed spec folder.
 *
 * @param context - the folder, its spec.md before (at the merge base) and after, the branch, the commits and the prefixes.
 * @example
 * specCheckForeignStatus({ folder: "os-3-x", before: a, after: b, branch: "os-4-y", commits: [], prefixes: ["os"] });
 */
export function specCheckForeignStatus(context: {
  folder: string;
  before?: string;
  after?: string;
  branch?: string;
  commits?: readonly string[];
  prefixes?: readonly string[];
}): string[] {
  const { folder, before = "", after = "", branch = "", commits = [], prefixes = [] } = context;
  if (specIsOwn(folder, branch, prefixes) || !before) return [];
  const [was, now] = [specStatusLine(before), specStatusLine(after)];
  if (was === now) return [];
  const parsed = specFolderOf(folder);
  const key = parsed ? `${parsed.prefix.toUpperCase()}-${parsed.number}` : undefined;
  if (key && specRefsKeys(commits, prefixes).has(key)) return [];
  return [
    `${folder}: this PR changes another spec's Status line (\`${was || "(none)"}\` → \`${now || "(none)"}\`), but no commit has \`Refs: ${key ?? "?"}\``,
  ];
}
