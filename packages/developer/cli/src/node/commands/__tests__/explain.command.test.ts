/**
 * Stackra file contract:
 * Purpose: unit tests of `ExplainCommand` on the console: a gen, check and Runway code explained with its cause, fix,
 *          docs link (the code's group in the error-code reference) and the command that shows it again, as text and
 *          as the `--json` data; a code in another case or with `-` for `_` found; an unknown code exits 2 with close
 *          codes as the hint and the reference as the docs link; a missing code exits 2 without a terminal; and the
 *          command is a read-only local MCP tool.
 * Boundary: test only; reads the committed catalogue, writes nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2891.
 */
import { toolsOf } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import { ERROR_CODES_PAGE } from "@stackra/gen";
import { describe, expect, it } from "@stackra/testing";

import { ExplainCommand } from "#node/commands/explain.command";

const explain = (args: string[]) => runCommandForTest([ExplainCommand], ["explain", ...args]);

describe("ExplainCommand", () => {
  it("explains a gen code with its cause, fix, docs link and the command to see it again", async () => {
    const result = await explain(["shape_number_kind"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("shape_number_kind · gen · Shapes and fields");
    expect(result.stdout).toContain("A number field has neither `@Int` nor `@Num`, or both.");
    expect(result.stdout).toContain("Add `@Int` for whole numbers");
    expect(result.stdout).toContain(`Docs   ${ERROR_CODES_PAGE}#shapes-and-fields`);
    expect(result.stdout).toContain("Rerun  stackra gen --check");
  });

  it("returns the entry as the --json data", async () => {
    const result = await explain(["json-configs", "--json"]);

    expect(result.exitCode).toBe(0);
    expect((result.json as { data: unknown }).data).toEqual({
      code: "json-configs",
      tool: "check",
      group: "Repository rules",
      cause: expect.stringContaining(".jsonc"),
      fix: expect.any(String),
      docs: `${ERROR_CODES_PAGE}#repository-rules`,
      rerun: "stackra check",
    });
  });

  it("finds a code typed in another case or with - for _", async () => {
    const lower = await explain(["runwaylockederror", "--json"]);
    const dashed = await explain(["shape-number-kind", "--json"]);

    expect((lower.json as { data: { code: string; rerun?: string } }).data).toMatchObject({
      code: "RunwayLockedError",
      docs: `${ERROR_CODES_PAGE}#runway-errors`,
    });
    expect((lower.json as { data: { rerun?: string } }).data.rerun).toBeUndefined();
    expect((dashed.json as { data: { code: string } }).data.code).toBe("shape_number_kind");
  });

  it("refuses an unknown code with close codes and the reference", async () => {
    const result = await explain(["shape_numbr_kind", "--json"]);

    expect(result.exitCode).toBe(2);
    expect((result.json as { error: unknown }).error).toEqual({
      code: "usage",
      message: "unknown error code: shape_numbr_kind",
      docs: ERROR_CODES_PAGE,
    });
    const text = await explain(["shape_numbr_kind"]);
    expect(text.stderr).toContain("Did you mean shape_number_kind");
    expect(text.stderr).toContain(ERROR_CODES_PAGE);
  });

  it("points at the whole reference when nothing is close", async () => {
    const result = await explain(["zzzzzzzzzzzzzzzz"]);

    expect(result.exitCode).toBe(2);
    // The error box wraps long lines; read it as one line without its borders.
    expect(result.stderr.replaceAll(/[│\s]+/g, " ")).toContain("the Docs link lists every code");
    expect(result.stderr).toContain(ERROR_CODES_PAGE);
  });

  it("needs a code when there is no terminal to ask on", async () => {
    expect((await explain([])).exitCode).toBe(2);
  });

  it("is a read-only tool of the local MCP", () => {
    const [tool] = toolsOf(
      { name: "stackra", version: "0.0.0", commands: [ExplainCommand] },
      { cwd: process.cwd(), process: () => ({}) as never },
    );

    expect(tool).toMatchObject({ name: "explain", readOnly: true });
    expect(tool?.inputSchema).toMatchObject({ properties: { code: { type: "string" } } });
  });
});
