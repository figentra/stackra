/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ToolSource`: an `Enum.of` enum holding the two things an MCP tool projects, a query
 *          and an action, codes in source order, with a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0155 (decision 1); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ToolSource } from "#core/enums/tool-source.enum";

describe("ToolSource", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(ToolSource)).toEqual(["query", "action"]);
    expect(ToolSource.Query).toBe("query");
    expect(ToolSource.Action).toBe("action");
  });

  it("types its values", () => {
    expectTypeOf<ToolSource>().toEqualTypeOf<"query" | "action">();
  });
});
