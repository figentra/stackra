/**
 * Stackra file contract:
 * Purpose: hold `post-write-checks.mjs` to its contract: it reports a file oxfmt would reformat and never blocks.
 * Boundary: test only; runs the hook as a child process on fixture payloads and temporary directories.
 * Runtime: node (node:test)
 * Governing contract: ADR 0016; ADR 0022 (tests live in tests folders).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const hook = new URL("../post-write-checks.mjs", import.meta.url).pathname;

// A fake oxfmt that "fails" the check for files containing BAD.
const root = mkdtempSync(join(tmpdir(), "post-write-"));
mkdirSync(join(root, "node_modules/.bin"), { recursive: true });
const bin = join(root, "node_modules/.bin/oxfmt");
writeFileSync(
  bin,
  `#!/usr/bin/env node\nimport { readFileSync } from "node:fs";\nprocess.exit(readFileSync(process.argv.at(-1), "utf8").includes("BAD") ? 1 : 0);\n`,
);
chmodSync(bin, 0o755);

const run = (name, body, dir = root) => {
  const file = join(dir, name);
  writeFileSync(file, body);
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ tool_input: { file_path: file } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  assert.equal(readFileSync(file, "utf8"), body, "file must never be rewritten");
  return r.stdout;
};

test("reports an unformatted file, without rewriting it", () => {
  assert.match(run("a.ts", "BAD"), /not oxfmt-formatted/);
});
test("silent for a formatted file", () => assert.equal(run("b.ts", "ok"), ""));
test("silent for an unchecked extension", () => assert.equal(run("c.txt", "BAD"), ""));
test("silent when oxfmt is not installed", () => {
  const bare = mkdtempSync(join(tmpdir(), "post-write-bare-"));
  try {
    assert.equal(run("d.ts", "BAD", bare), "");
  } finally {
    rmSync(bare, { recursive: true, force: true });
  }
});
test("never fails on a missing file", () => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ tool_input: { file_path: join(root, "nope.ts") } }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
});
test("cleanup", () => rmSync(root, { recursive: true, force: true }));
