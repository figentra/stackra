/**
 * Stackra file contract:
 * Purpose: read every schema release from git: each `schemas@<version>` tag and the tools/schemas files at it.
 *          Rebuilding old releases from their tags on every deploy is what keeps the exact-version paths alive and
 *          byte-stable, because a Workers assets deploy replaces the whole asset set.
 * Boundary: runs read-only git commands (`tag --list`, `ls-tree`, `show`) in the given root; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 3).
 */
import { execFileSync } from "node:child_process";

import { SCHEMA_TAG_PREFIX, SCHEMAS_DIR } from "#src/constants";
import type { SchemaRelease } from "#src/interfaces";

/** A release version is plain `major.minor.patch`; pre-release and build suffixes are not published. */
const VERSION = /^\d+\.\d+\.\d+$/;

/**
 * Read every schema release tag in the repository.
 *
 * A git failure (no repository, git missing) is thrown, never swallowed: building with no releases would deploy a
 * site that deletes every published version. A CI checkout therefore needs the tags (`fetch-depth: 0`).
 *
 * @param root - absolute path of the repository root (any path inside the work tree works).
 * @returns one release per tag, in git's tag order (plan-site.ts sorts).
 * @throws Error when a tag after the prefix is not a plain `x.y.z` version, or when git fails.
 */
export function readSchemaReleases(root: string): SchemaRelease[] {
  const git = (...args: string[]): string =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const tags = git("tag", "--list", `${SCHEMA_TAG_PREFIX}*`).split("\n").filter(Boolean);
  return tags.map((tag) => {
    const version = tag.slice(SCHEMA_TAG_PREFIX.length);
    if (!VERSION.test(version))
      throw new Error(`tag ${tag}: the version after "${SCHEMA_TAG_PREFIX}" must be x.y.z`);
    // ls-tree on "dir/" lists that folder's entries as full paths; an empty result means the tag predates it.
    const files = git("ls-tree", "--name-only", tag, "--", `${SCHEMAS_DIR}/`)
      .split("\n")
      .filter((file) => file.endsWith(".schema.json"));
    return {
      version,
      schemas: files.map((file) => ({ file, text: git("show", `${tag}:${file}`) })),
    };
  });
}
