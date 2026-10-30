/**
 * Stackra file contract:
 * Purpose: unit tests of `specTrace`, `specTraceProblems`, `specCoversTags` and `specDrift` on the `os-901-widget`
 *          fixture: the trace matrix, the Done rules and the drift rules.
 * Boundary: test only; reads the fixture folder beside this file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0120 (traceability); ADR 0022 (test placement).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { specCoversTags } from "#node/functions/spec-covers-tags.function";
import { specDrift } from "#node/functions/spec-drift.function";
import { specTraceProblems } from "#node/functions/spec-trace-problems.function";
import { specTrace } from "#node/functions/spec-trace.function";

const FOLDER = "os-901-widget";
const read = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`fixtures/sdd/${FOLDER}/${name}`, import.meta.url)), "utf8");
const base = {
  folder: FOLDER,
  spec: read("spec.md"),
  plan: read("plan.md"),
  tasks: read("tasks.md"),
  prefixes: ["os"],
};

describe("specCoversTags", () => {
  it("reads only the spec's own key", () => {
    expect(
      specCoversTags("/** @covers os-901:FR-001 sta-7:FR-002, os-901:P-001 */", "os-901"),
    ).toEqual(["FR-001", "P-001"]);
    expect(specCoversTags("// @covers OS-901:fr-001", "os-901")).toEqual(["FR-001"]);
  });
});

describe("specTrace", () => {
  it("covers an FR directly or through a tested P, and drops struck IDs", () => {
    const t = specTrace({ ...base, tests: "@covers os-901:P-001" });
    expect(t.key).toBe("901");
    expect(t.frs.map((f) => [f.id, f.tasks, f.via])).toEqual([
      ["FR-001", ["T001"], ["P-001"]],
      ["FR-002", ["T002"], ["P-001"]],
    ]);
    expect(specTraceProblems(t, "os")).toEqual([]);
  });

  it("needs every FR and P tested and every SC's method for Done", () => {
    const untested = specTraceProblems(
      specTrace({ ...base, tests: "@covers os-901:FR-001" }),
      "os",
    );
    expect(untested.join("\n")).toMatch(/FR-002 has no test carrying `@covers os-901:FR-002`/);
    expect(untested.join("\n")).toMatch(/P-001 has no test/);
    const spec = base.spec.replace(" — verified by: manual", "");
    expect(
      specTraceProblems(specTrace({ ...base, spec, tests: "@covers os-901:P-001" }), "os"),
    ).toEqual(['SC-002 names no verification method ("— verified by: unit|e2e|k6|manual")']);
  });
});

describe("specDrift", () => {
  const docs = "apps/docs/src/docs/guides/widget.mdx";

  it("accepts a diff inside the Impact members", () => {
    expect(
      specDrift({ ...base, changed: ["packages/foundation/widget/src/build.ts", docs] }),
    ).toEqual([]);
  });

  it("flags unnamed members unless another spec in the diff names them", () => {
    const changed = ["packages/data/other/src/x.ts", docs];
    expect(specDrift({ ...base, changed }).join()).toMatch(
      /changes `packages\/data\/other`, which no spec in the diff names in its Impact/,
    );
    expect(specDrift({ ...base, changed, named: new Set(["packages/data/other"]) })).toEqual([]);
  });

  it("flags untouched docs at Done and ticked tasks whose paths are gone", () => {
    expect(specDrift({ ...base, changed: [] }).join()).toMatch(
      /Impact's doc `apps\/docs\/src\/docs\/guides\/widget\.mdx` is not touched/,
    );
    expect(
      specDrift({ ...base, changed: [docs], exists: (p) => !p.endsWith("build.ts") }).join(),
    ).toMatch(
      /T002 is ticked, but its path `packages\/foundation\/widget\/src\/build\.ts` does not exist/,
    );
  });
});
