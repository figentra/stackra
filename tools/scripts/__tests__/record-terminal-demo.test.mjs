/**
 * Stackra file contract:
 * Purpose: hold `record-terminal-demo.mjs` to its contract: the command comes first, colour codes and blank lines go,
 *          each printed line is classed by its mark, the temporary folder becomes `~`, and a missing `--out` or command
 *          is a usage error.
 * Boundary: `toLines` on fixed text; the usage error runs the script with no command, so nothing is executed.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-2041.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { toLines } from "../record-terminal-demo.mjs";

test("classes each line by its mark, strips colour and hides the temporary folder", () => {
  const text = "\u001B[32m✓\u001B[0m Node 24\n\n? Template\n❯ app\n  Wrote /tmp/x/my-app\n";
  assert.deepEqual(toLines("stackra create my-app", text, "/tmp/x"), [
    { kind: "command", text: "stackra create my-app" },
    { kind: "success", text: "Node 24" },
    { kind: "prompt", text: "Template" },
    { kind: "choice", text: "app" },
    { kind: "output", text: "  Wrote ~/my-app" },
  ]);
});

test("refuses a missing --out or command", () => {
  const script = fileURLToPath(new URL("../record-terminal-demo.mjs", import.meta.url));
  const run = spawnSync(process.execPath, [script, "--out", "x.json"], { encoding: "utf8" });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /usage/);
});
