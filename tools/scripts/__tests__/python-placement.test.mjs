/**
 * Stackra file contract:
 * Purpose: hold `python-placement.mjs` to its contract: a `.py` file under `packages/infrastructure/infra-tools/images/`
 *          (including its `__tests__`) is allowed; one in a service, a package outside that folder, an app or the
 *          tooling is reported with its folder; skipped folders (`node_modules`, `.claude`, `.notes`, `dist`, `.venv`)
 *          and non-Python files report nothing.
 * Boundary: writes fixture trees into temp directories; reads nothing of this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0492 (decision 7).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { pythonPlacementFindings } from "../python-placement.mjs";

/** A temp checkout holding an empty file at each of `files`. */
function checkout(files) {
  const root = mkdtempSync(join(tmpdir(), "python-placement-"));
  for (const file of files) {
    mkdirSync(join(root, dirname(file)), { recursive: true });
    writeFileSync(join(root, file), "");
  }
  return root;
}

test("Python inside the infra-tools images folder is allowed", () => {
  const root = checkout([
    "packages/infrastructure/infra-tools/images/ocr/server.py",
    "packages/infrastructure/infra-tools/images/ocr/__tests__/test_server.py",
    "packages/infrastructure/infra-tools/images/speech/audio.py",
  ]);
  assert.deepEqual(pythonPlacementFindings(root), []);
});

test("a .py file anywhere else is reported with its folder", () => {
  const root = checkout([
    "services/example/src/score.py",
    "packages/data/search/src/node/rank.py",
    "packages/infrastructure/infra-tools/src/helper.py",
    "packages/infrastructure/infra-tools-extra/images/x.py",
    "tools/scripts/build.py",
    "setup.py",
  ]);
  assert.deepEqual(
    pythonPlacementFindings(root).map(({ dir, text }) => [dir, text.split(":")[0]]),
    [
      ["packages/data/search/src/node", "rank.py"],
      ["packages/infrastructure/infra-tools-extra/images", "x.py"],
      ["packages/infrastructure/infra-tools/src", "helper.py"],
      ["services/example/src", "score.py"],
      [".", "setup.py"],
      ["tools/scripts", "build.py"],
    ],
  );
  assert.match(pythonPlacementFindings(root)[0].text, /ADR 0492 decision 7/);
});

test("skipped folders and non-Python files report nothing", () => {
  const root = checkout([
    "node_modules/pkg/setup.py",
    ".claude/worktrees/x/services/a/tool.py",
    ".notes/scratch.py",
    "packages/data/search/dist/build.py",
    "apps/console/.venv/lib/site.py",
    "services/example/src/readme.pyi.txt",
    "services/example/src/main.ts",
  ]);
  assert.deepEqual(pythonPlacementFindings(root), []);
});
