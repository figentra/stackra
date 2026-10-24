/**
 * Stackra file contract:
 * Purpose: `previousRelease`, the manifest a package published with its last release: the newest release tag of the
 *          package (`<name>@<version>`, as Changesets tags it), and the member's `stackra.manifest.json` at that tag,
 *          read from git relative to the working directory. A package that has never been released has an empty
 *          baseline, so every change is an addition.
 * Boundary: runs `git` read-only (`tag --list`, `show`); never fetches or writes. A tag whose manifest did not exist
 *           yet is an empty baseline too.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 22); ADR 0158; ADR 0131 (deprecation and sunset).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { StackraManifest } from "@stackra/contracts";

/** `execFile` as a promise. */
const run = promisify(execFile);

/**
 * The manifest of `packageName`'s last release.
 *
 * @param packageName - the package name, as its release tags spell it.
 * @param options - `cwd` is the member root (the working directory by default); `manifest` the file's path from it.
 * @throws Error when `cwd` is not inside a git repository.
 * @example
 * const previous = await previousRelease("@acme/loyalty-kit");
 */
export async function previousRelease(
  packageName: string,
  options: { readonly cwd?: string; readonly manifest?: string } = {},
): Promise<StackraManifest> {
  const cwd = options.cwd ?? process.cwd();
  const baseline: StackraManifest = { member: "", package: packageName, version: "0.0.0" };
  const { stdout: tags } = await run(
    "git",
    ["tag", "--list", `${packageName}@*`, "--sort=-v:refname"],
    { cwd },
  );
  const latest = tags
    .split("\n")
    .find((tag) => tag.trim() !== "")
    ?.trim();
  if (latest === undefined) return baseline;
  try {
    const { stdout } = await run(
      "git",
      ["show", `${latest}:./${options.manifest ?? "stackra.manifest.json"}`],
      {
        cwd,
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    return JSON.parse(stdout) as StackraManifest;
  } catch {
    // the release predates the committed manifest
    return baseline;
  }
}
