/**
 * Stackra file contract:
 * Purpose: unit tests of the release reader against a throwaway git repository: tagged schemas are read as they were
 *          at the tag, a tag older than tools/schemas yields no schemas, and a malformed tag fails.
 * Boundary: creates and deletes a temporary directory; runs git there only.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 3); ADR 0022 (test placement).
 */
// @covers sta-322:FR-004 sta-322:P-004
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readSchemaReleases } from "#src/site/read-schema-releases";

let root = "";
// A git hook (lefthook) exports GIT_DIR and friends; drop them so git here can never touch the real repository.
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
);
const git = (...args: string[]): string =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
    cwd: root,
    encoding: "utf8",
    env,
  });
const commit = (message: string): void => {
  git("add", "-A");
  git("commit", "--no-verify", "--no-gpg-sign", "--allow-empty", "-m", message);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "static-releases-"));
  git("init", "--quiet");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("readSchemaReleases", () => {
  it("reads each tag's schemas as they were at the tag", () => {
    commit("before schemas");
    git("tag", "schemas@0.1.0");
    mkdirSync(join(root, "tools/schemas"), { recursive: true });
    writeFileSync(join(root, "tools/schemas/mcp.schema.json"), '{"v":1}');
    writeFileSync(join(root, "tools/schemas/README.md"), "not a schema");
    commit("schemas");
    git("tag", "schemas@1.0.0");
    writeFileSync(join(root, "tools/schemas/mcp.schema.json"), '{"v":2}');
    commit("change after the tag");

    const releases = readSchemaReleases(root).sort((a, b) => a.version.localeCompare(b.version));
    expect(releases).toEqual([
      { version: "0.1.0", schemas: [] },
      { version: "1.0.0", schemas: [{ file: "tools/schemas/mcp.schema.json", text: '{"v":1}' }] },
    ]);
  });

  it("ignores other tags and rejects a schemas tag that is not x.y.z", () => {
    commit("one");
    git("tag", "@stackra/tokens@1.0.0");
    expect(readSchemaReleases(root)).toEqual([]);
    git("tag", "schemas@1.0.0-rc.1");
    expect(() => readSchemaReleases(root)).toThrow(/must be x\.y\.z/);
  });
});
