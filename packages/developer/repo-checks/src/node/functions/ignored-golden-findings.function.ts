/**
 * Stackra file contract:
 * Purpose: `ignoredGoldenFindings(context)`, `checkIgnoredGoldens` over the disk: every file under each `__golden__`
 *          folder that holds a listed file, asked of `git check-ignore`.
 * Boundary: reads the folders and runs `git check-ignore` once; never throws for a missing git (it finds nothing).
 *           Shortcut: a `__golden__` folder is found through a file git lists in it, so a folder whose every file is
 *           ignored is missed; upgrade by walking the tree if that happens.
 * Runtime: node
 * Governing contract: STA-1807.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { checkIgnoredGoldens } from "#node/functions/check-ignored-goldens.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/** Every file under `dir` (repository-relative), dot folders included. */
function filesUnder(root: string, dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(root, `${dir}/${entry.name}`) : [`${dir}/${entry.name}`],
  );
}

/** The `__golden__` folder holding `path`, or none. */
function goldenFolderOf(path: string): string[] {
  const parts = path.split("/");
  const at = parts.indexOf("__golden__");
  return at < 0 ? [] : [parts.slice(0, at + 1).join("/")];
}

/**
 * The ignored-golden findings of the repository.
 *
 * @param context - the root and its file list.
 * @example
 * ignoredGoldenFindings(readRepoContext(root));
 */
export function ignoredGoldenFindings(context: RepoContext): RawFinding[] {
  const { root, files } = context;
  const folders = new Set(files.flatMap(goldenFolderOf));
  const onDisk = [...folders].flatMap((dir) => filesUnder(root, dir));
  if (onDisk.length === 0) return [];
  const probe = spawnSync("git", ["check-ignore", "--stdin", "-z"], {
    cwd: root,
    encoding: "utf8",
    input: onDisk.join("\0"),
    maxBuffer: 256 * 1024 * 1024,
  });
  const ignored = new Set((probe.stdout ?? "").split("\0").filter(Boolean));
  return checkIgnoredGoldens(onDisk, (p) => ignored.has(p)).map((text) => ({
    rule: "ignored-goldens",
    dir: "",
    text,
  }));
}
