/**
 * Stackra file contract:
 * Purpose: runs oxlint with the boundaries preset over fixtures/hooks and proves the STA-1655 carve-out: a class
 *          component's hook field is not reported (ADR 0305 rules 37, 38 and 41), while a conditional hook in a hook file
 *          still is.
 * Boundary: test only; the fixture folders mimic packages/<category>/<name>/src/react.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 37 to 41); STA-1655.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fixtures = join(root, "src", "__tests__", "fixtures", "hooks");

it("boundaries.jsonc allows class hook fields and still checks hook files", () => {
  const run = spawnSync(
    join(root, "node_modules", ".bin", "oxlint"),
    ["-c", "src/boundaries.jsonc", "-f", "json", fixtures],
    { cwd: root, encoding: "utf8" },
  );
  const { diagnostics } = JSON.parse(run.stdout) as {
    diagnostics: { code: string; filename: string }[];
  };
  const files = new Set(
    diagnostics
      .filter((d) => d.code.endsWith("(rules-of-hooks)"))
      .map((d) => relative(fixtures, join(root, d.filename))),
  );

  expect([...files]).toEqual(["packages/ui/demo/src/react/use-queue/use-queue.ts"]);
});
