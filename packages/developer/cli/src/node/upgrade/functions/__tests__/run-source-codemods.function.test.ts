/**
 * Stackra file contract:
 * Purpose: unit tests of `runSourceCodemods`: codemods run in order over one file (a rename then a report on the
 *          renamed text), a file that names none of their modules comes back unchanged and unparsed, a mention of a
 *          module in a comment alone changes nothing, and a single-quoted file gets single-quoted new imports.
 * Boundary: test only; runs the real ast-grep and ts-morph engines over strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import type { Project } from "ts-morph";

import { beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { createCodemodProject } from "#node/upgrade/functions/create-codemod-project.function";
import { loadCodemodEngines } from "#node/upgrade/functions/load-codemod-engines.function";
import { runSourceCodemods } from "#node/upgrade/functions/run-source-codemods.function";
import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

const base = { title: "t", note: "n", source: "s" };
const MOVE: UpgradeCodemod = {
  ...base,
  id: "move",
  version: "0.4.0",
  renames: [{ name: "Old", from: ["@acme/a"], to: "@acme/b", rename: "New" }],
};
const REPORT: UpgradeCodemod = {
  ...base,
  id: "report",
  version: "0.5.0",
  report: { modules: ["@acme/b"], rule: { pattern: "New($$$)" }, message: "check the call" },
};

let engines: CodemodEngines;
let project: Project;

beforeAll(async () => {
  engines = await loadCodemodEngines();
  project = createCodemodProject(engines);
});

describe("runSourceCodemods", () => {
  it("runs the codemods in order: the report sees the renamed import", () => {
    const result = runSourceCodemods(
      engines,
      project,
      "src/a.ts",
      'import { Old, keep } from "@acme/a";\n\nexport const value = Old(keep);\n',
      [MOVE, REPORT],
    );
    expect(result.text).toBe(
      'import { keep } from "@acme/a";\nimport { New } from "@acme/b";\n\nexport const value = New(keep);\n',
    );
    expect(result.changedBy).toEqual(["move"]);
    expect(result.findings).toEqual([
      {
        codemod: "report",
        file: "src/a.ts",
        line: 4,
        column: 22,
        code: "New(keep)",
        message: "check the call",
      },
    ]);
  });

  it("answers a file that names none of the modules without parsing it", () => {
    // A module namespace cannot be spied on, so the engines are copied with a recording parse.
    const parse = vi.fn(engines.astGrep.parse);
    const spied = { ...engines, astGrep: { ...engines.astGrep, parse } } as CodemodEngines;
    const text = 'import { Old } from "@acme/c";\n';
    expect(runSourceCodemods(spied, project, "src/c.ts", text, [MOVE, REPORT])).toEqual({
      text,
      changedBy: [],
      findings: [],
    });
    expect(parse).not.toHaveBeenCalled();
    runSourceCodemods(spied, project, "src/d.ts", 'import { Old } from "@acme/a";\n', [MOVE]);
    expect(parse).toHaveBeenCalled();
  });

  it("changes nothing when the module is only mentioned, and keeps a file's single quotes", () => {
    const mention = '// Old came from "@acme/a"\nexport const Old = 1;\n';
    expect(runSourceCodemods(engines, project, "src/m.ts", mention, [MOVE]).text).toBe(mention);
    expect(
      runSourceCodemods(engines, project, "src/q.js", "import { Old } from '@acme/a';\nOld();\n", [
        MOVE,
      ]).text,
    ).toBe("import { New } from '@acme/b';\nNew();\n");
  });
});
