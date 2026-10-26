/**
 * Stackra file contract:
 * Purpose: unit tests of `walkRepoFiles` and the `readRepoContext` fallback: nested `.gitignore` files, directory-only,
 *          anchored, `**` and negated patterns, `.git` and `node_modules` never entered, and a folder whose `.git` file
 *          points at a missing checkout still yields its files instead of throwing.
 * Boundary: test only; builds trees in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { readRepoContext } from "#node/functions/read-repo-context.function";
import { walkRepoFiles } from "#node/functions/walk-repo-files.function";

/** A temporary tree holding `files` (path to content). */
function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "walk-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

describe("walkRepoFiles", () => {
  it("honours nested .gitignore files and the usual pattern forms", () => {
    const root = tree({
      ".gitignore":
        "dist/\n/.stackra/*\n!.stackra/app-manifest.json\n*.log\n**/cache/**\n# comment\n",
      "a.ts": "",
      "debug.log": "",
      "dist/x.js": "",
      "src/dist": "",
      ".stackra/app-manifest.json": "",
      ".stackra/tmp.json": "",
      "packages/p/.gitignore": "/local.ts\n",
      "packages/p/local.ts": "",
      "packages/p/src/local.ts": "",
      "packages/p/cache/c.bin": "",
      "node_modules/m/index.js": "",
      ".git/HEAD": "",
    });
    expect(walkRepoFiles(root)).toEqual([
      ".gitignore",
      ".stackra/app-manifest.json",
      "a.ts",
      "packages/p/.gitignore",
      "packages/p/src/local.ts",
      "src/dist",
    ]);
  });

  it("is what readRepoContext uses when the .git file points at a missing checkout", () => {
    const root = tree({ ".git": "gitdir: /nowhere/at/all\n", "a.json": "{}" });
    expect(readRepoContext(root).files).toEqual(["a.json"]);
  });
});
