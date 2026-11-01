/**
 * Stackra file contract:
 * Purpose: runs oxlint with the base preset over fixtures/cycle and proves the STA-1654 carve-out: a two-way relation
 *          between model files is not reported, while a cycle through a non-model file still fails at that file.
 * Boundary: test only; the fixture folders mimic packages/<category>/<name>/src/node/{models,totals}.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0129; STA-1654.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fixtures = join(root, "src", "__tests__", "fixtures", "cycle");

it("base.jsonc reports a cycle through a non-model file but not one among models", () => {
  const run = spawnSync(
    join(root, "node_modules", ".bin", "oxlint"),
    ["-c", "src/base.jsonc", "-f", "json", fixtures],
    { cwd: root, encoding: "utf8" },
  );
  const { diagnostics } = JSON.parse(run.stdout) as {
    diagnostics: { code: string; filename: string }[];
  };
  const cycles = diagnostics
    .filter((d) => d.code.endsWith("(no-cycle)"))
    .map((d) => relative(fixtures, join(root, d.filename)));

  expect(cycles).toEqual(["packages/commerce/orders/src/node/totals/order-totals.ts"]);
});
