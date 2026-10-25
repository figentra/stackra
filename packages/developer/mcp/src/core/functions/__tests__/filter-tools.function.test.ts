/**
 * Stackra file contract:
 * Purpose: unit tests of `filterTools`: a tool without the caller's permission dropped, a tool outside the tenant's
 *          entitlements named in `locked`, the rest kept in order.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0155 (decisions 3 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { filterTools } from "#core/functions/filter-tools.function";
import type { HostedTool } from "#core/types/hosted-tool.type";

/** A tool row with only what the filter reads varying. */
function tool(name: string, permission: string): HostedTool {
  return {
    name,
    inputSchema: { type: "object" },
    annotations: {},
    action: `${name}@1`,
    member: "commerce",
    permission,
    risk: "L1",
    effects: [],
  };
}

describe("filterTools", () => {
  it("drops what the caller cannot do and locks what the tenant has not bought", () => {
    const table = [tool("a", "p.read"), tool("b", "p.write"), tool("c", "p.read")];
    const result = filterTools(table, {
      can: (permission) => permission === "p.read",
      isEntitled: (candidate) => candidate.name !== "c",
    });
    expect(result.tools.map((item) => item.name)).toEqual(["a"]);
    expect(result.locked).toEqual(["c"]);
  });
});
