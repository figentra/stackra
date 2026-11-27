/**
 * Stackra file contract:
 * Purpose: the error-code catalogue guard (STA-2891): `@stackra/gen`'s `ERROR_CODES` holds exactly the rows of
 *          `customers/error-codes` (code, tool, group, the group heading's site id, cause, fix), and every code gen,
 *          `stackra check` and Runway can print has a row, so `stackra explain`, gen's docs line and the MCP's
 *          `explain` tool never meet a code they cannot explain. Unit tests pin `headingAnchors` (the site's own
 *          heading ids, a repeated heading's suffix, fenced blocks skipped, inline Markdown refused),
 *          `catalogueEntries` and `renderCatalogue`.
 * Boundary: test only; reads the page and the tools' source under packages/developer from disk; writes nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0294 (decision 26); STA-2853; STA-2891.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { ERROR_CODES } from "@stackra/gen";
import { describe, expect, it } from "@stackra/testing";

import { CATALOGUE_PATHS } from "../catalogue-paths";
import { catalogueEntries } from "../catalogue-entries";
import { declaredCodes } from "../declared-codes";
import { emittedCodes } from "../emitted-codes";
import { errorClasses } from "../error-classes";
import { headingAnchors } from "../heading-anchors";
import { renderCatalogue } from "../render-catalogue";

const ROOT = fileURLToPath(new URL("../../../../../", import.meta.url));
const DEVELOPER = join(ROOT, "packages/developer");
const PAGE = readFileSync(join(ROOT, CATALOGUE_PATHS.page), "utf8");

/** The codes the catalogue lists for one tool. */
const listed = (tool: string) =>
  new Set(ERROR_CODES.filter((entry) => entry.tool === tool).map((entry) => entry.code));

describe("headingAnchors", () => {
  it("gives the ids the site gives, a repeated heading suffixed, fenced blocks skipped", () => {
    const text = [
      "## Gen",
      "",
      "```md",
      "## Not a heading",
      "```",
      "### Apps: Expo and Encore",
      "### Files, classes and kinds",
      "## Gen",
    ].join("\n");

    expect(headingAnchors(text)).toEqual([
      { line: 1, depth: 2, text: "Gen", id: "gen" },
      { line: 6, depth: 3, text: "Apps: Expo and Encore", id: "apps-expo-and-encore" },
      { line: 7, depth: 3, text: "Files, classes and kinds", id: "files-classes-and-kinds" },
      { line: 8, depth: 2, text: "Gen", id: "gen-1" },
    ]);
  });

  it("refuses a heading whose id needs the full Markdown parser", () => {
    expect(() => headingAnchors("## The `gen` codes")).toThrow(/line 1/);
  });
});

describe("catalogueEntries and renderCatalogue", () => {
  const page = [
    "## Gen",
    "",
    "### Shapes and fields",
    "",
    "| Code | Cause | Fix |",
    "| --- | --- | --- |",
    '| `a_code` | A "quoted" cause. | Its fix with `a | pipe`. |',
    "",
    "## Runway",
    "",
    "| `RunwayLockedError` | Busy. | Wait. |",
  ].join("\n");

  it("reads each row with its tool, group and the group's id", () => {
    expect(catalogueEntries(page)).toEqual([
      {
        code: "a_code",
        tool: "gen",
        group: "Shapes and fields",
        anchor: "shapes-and-fields",
        cause: 'A "quoted" cause.',
        fix: "Its fix with `a | pipe`.",
      },
      {
        code: "RunwayLockedError",
        tool: "runway",
        group: "Runway",
        anchor: "runway",
        cause: "Busy.",
        fix: "Wait.",
      },
    ]);
  });

  it("refuses a code under a section that names no tool", () => {
    expect(() => catalogueEntries("## Other\n\n| `x_y` | why | do |\n")).toThrow(/x_y/);
  });

  it("writes every field as a JSON string, so quotes and backticks survive", () => {
    const text = renderCatalogue(catalogueEntries(page));

    expect(text).toContain('    cause: "A \\"quoted\\" cause.",\n');
    expect(text).toContain('    fix: "Its fix with `a | pipe`.",\n');
    expect(text.endsWith("];\n")).toBe(true);
  });
});

describe("the error-code catalogue", () => {
  it("holds exactly the rows of the error-code reference (run pnpm error-codes:write)", () => {
    expect(ERROR_CODES).toEqual(catalogueEntries(PAGE));
  });

  it("has a row for every code gen can print", () => {
    const { codes } = emittedCodes(join(DEVELOPER, "gen/src"), {
      property: "code",
      siblings: ["fix"],
    });
    const gen = listed("gen");

    expect(codes.size).toBeGreaterThan(150);
    expect([...codes.keys()].filter((code) => !gen.has(code))).toEqual([]);
  });

  it("has a row for every rule stackra check names and every Runway code and error", () => {
    const shape = { property: "rule", siblings: ["text", "message"] };
    const rules = [
      ...emittedCodes(join(DEVELOPER, "repo-checks/src"), shape).codes.keys(),
      ...emittedCodes(join(DEVELOPER, "cli/src"), shape).codes.keys(),
    ];
    const runway = join(DEVELOPER, "runway/src");
    const runwayCodes = [...declaredCodes(runway, "code").keys(), ...errorClasses(runway)];
    const check = listed("check");
    const listedRunway = listed("runway");

    expect(rules.filter((rule) => !check.has(rule))).toEqual([]);
    expect(runwayCodes.filter((code) => !listedRunway.has(code))).toEqual([]);
  });
});
