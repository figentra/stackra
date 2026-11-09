/**
 * Stackra file contract:
 * Purpose: unit tests of `StructureCommand` on the console: the page prints byte-exact (unindented), `--json` carries
 *          it as `{ page }`, and `--write-docs` writes it into the docs app of the workspace root and says where.
 * Boundary: test only; the page renderer and writer are replaced, so no file is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { StructureCommand } from "#node/commands/structure.command";
import { writeStructureDoc } from "#node/structure/functions/write-structure-doc.function";

vi.mock("#node/structure/functions/render-structure-doc.function", () => ({
  renderStructureDoc: () => "---\ntitle: Structure\n---",
}));
vi.mock("#node/structure/functions/write-structure-doc.function", () => ({
  writeStructureDoc: vi.fn((path: string) => path),
}));

describe("StructureCommand", () => {
  it("prints the page byte-exact, and as { page } under --json", async () => {
    const text = await runCommandForTest([StructureCommand], ["structure"]);
    expect(text.exitCode).toBe(0);
    expect(text.stdout).toBe("---\ntitle: Structure\n---\n");
    const json = await runCommandForTest([StructureCommand], ["structure", "--json"]);
    expect(json.json).toEqual({ ok: true, data: { page: "---\ntitle: Structure\n---" } });
  });

  it("writes the page with --write-docs", async () => {
    const result = await runCommandForTest([StructureCommand], ["structure", "--write-docs"]);
    expect(result.exitCode).toBe(0);
    expect(writeStructureDoc).toHaveBeenCalledWith(
      "/work/apps/docs/src/docs/standards/structure.mdx",
    );
    expect(result.stdout).toContain("wrote /work/apps/docs/src/docs/standards/structure.mdx");
  });
});
