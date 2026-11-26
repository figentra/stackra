/**
 * Stackra file contract:
 * Purpose: unit tests of `renameExports`, the cases the codemod fixtures do not reach: a default import kept beside a
 *          moved name, names of one import moving to two modules, an import already present in the target, an
 *          inline `type` name joining a value import, an unused import renamed, and a namespace use of a moved export
 *          reported at its place.
 * Boundary: test only; runs ts-morph in an in-memory project over strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import type { Project } from "ts-morph";

import { beforeAll, describe, expect, it } from "@stackra/testing";

import { createCodemodProject } from "#node/upgrade/functions/create-codemod-project.function";
import { loadCodemodEngines } from "#node/upgrade/functions/load-codemod-engines.function";
import { renameExports } from "#node/upgrade/functions/rename-exports.function";
import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";
import type { ExportRename } from "#node/upgrade/types/export-rename.type";

const RENAMES: readonly ExportRename[] = [
  { name: "Editor", from: ["@acme/ui"], to: "@acme/ui/editor" },
  { name: "Chart", from: ["@acme/ui"], to: "@acme/ui/charts", rename: "LineChart" },
  { name: "Old", from: ["@acme/ui"], to: "@acme/ui", rename: "New" },
];

let engines: CodemodEngines;
let project: Project;

beforeAll(async () => {
  engines = await loadCodemodEngines();
  project = createCodemodProject(engines);
});

let made = 0;
const run = (text: string) => {
  made += 1;
  const file = project.createSourceFile(`/case-${made}.ts`, text);
  const notes = renameExports(file, RENAMES, engines.tsMorph);
  const after = file.getFullText();
  project.removeSourceFile(file);
  return { after, notes };
};

describe("renameExports", () => {
  it("keeps a default import and splits names moving to two modules", () => {
    expect(
      run(`import Ui, { Button, Editor, Chart } from "@acme/ui";

export const parts = [Ui, Button, Editor, Chart];
`).after,
    ).toBe(`import Ui, { Button } from "@acme/ui";
import { Editor } from "@acme/ui/editor";
import { LineChart } from "@acme/ui/charts";

export const parts = [Ui, Button, Editor, LineChart];
`);
  });

  it("joins an existing import once, and an inline type joins a value import as a type", () => {
    expect(
      run(`import { Editor, type Chart } from "@acme/ui";
import { Editor as Same } from "@acme/ui/editor";
import { Line } from "@acme/ui/charts";

export type Parts = [typeof Editor, typeof Same, Chart, typeof Line];
`).after,
    ).toBe(`import { Editor as Same, Editor } from "@acme/ui/editor";
import { Line, type LineChart } from "@acme/ui/charts";

export type Parts = [typeof Editor, typeof Same, LineChart, typeof Line];
`);
  });

  it("renames an import nothing uses yet", () => {
    expect(run(`import { Old } from "@acme/ui";\n`).after).toBe(
      `import { New } from "@acme/ui";\n`,
    );
  });

  it("reports a namespace use of a moved export and renames one of a renamed export", () => {
    const { after, notes } = run(`import * as ui from "@acme/ui";

export const a = ui.Editor;
export const b = ui.Old;
`);
    expect(after).toBe(`import * as ui from "@acme/ui";

export const a = ui.Editor;
export const b = ui.New;
`);
    expect(notes).toEqual([
      {
        line: 3,
        column: 18,
        code: "ui.Editor",
        message: "Editor moved to @acme/ui/editor: import it from there",
      },
    ]);
  });
});
