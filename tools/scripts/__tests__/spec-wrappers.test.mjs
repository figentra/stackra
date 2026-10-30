/**
 * Stackra file contract:
 * Purpose: keeps core's spec-gate and spec-trace wrappers and the published `spec-*` functions of @stackra/repo-checks from
 *   drifting: over core's own `.agents/specs` folders (every one past Draft), the wrapper and the package return the same
 *   stage and trace problems, and the `**Linear**` hint is the only text the wrapper adds.
 * Boundary: reads the repository's spec folders; node:test and node:assert.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the checks are published, core keeps wrappers); ADR 0022 (test placement).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checks } from "../spec-checks.mjs";
import { checkStage, SPECS_DIR, statusOf } from "../spec-gate.mjs";
import { routes } from "../spec-parse.mjs";
import { trace, traceProblems } from "../spec-trace.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const HINT = " (spec-linear.mjs issue, or the Linear MCP)";
const readIf = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const known = routes(readIf(join(ROOT, ".agents/routing.yaml")));

const specs = readdirSync(join(ROOT, SPECS_DIR))
  .filter((f) => existsSync(join(ROOT, SPECS_DIR, f, "spec.md")))
  .map((folder) => {
    const dir = join(ROOT, SPECS_DIR, folder);
    return {
      folder,
      spec: readIf(join(dir, "spec.md")),
      plan: readIf(join(dir, "plan.md")),
      tasks: readIf(join(dir, "tasks.md")),
      files: readdirSync(dir),
    };
  })
  .filter((s) => statusOf(s.spec) !== "draft");

test("core has specs past Draft to compare on", () => {
  assert.ok(specs.length > 0);
});

test("the wrapper's stage problems equal the package's for every spec past Draft", () => {
  for (const s of specs) {
    const context = { files: s.files, plan: s.plan, tasks: s.tasks, known };
    const fromPackage = checks.specCheckStage(s.folder, s.spec, { ...context, prefixes: ["sta"] });
    const fromWrapper = checkStage(s.folder, s.spec, context).map((p) => p.replace(HINT, ""));
    assert.deepEqual(fromWrapper, fromPackage, s.folder);
  }
});

test("the wrapper's trace and Done problems equal the package's for every spec past Draft", () => {
  for (const s of specs) {
    const context = { folder: s.folder, spec: s.spec, plan: s.plan, tasks: s.tasks, tests: "" };
    const direct = checks.specTrace({ ...context, prefixes: ["sta"] });
    assert.deepEqual(trace(context), direct, s.folder);
    assert.deepEqual(traceProblems(direct), checks.specTraceProblems(direct, "sta"), s.folder);
  }
});
